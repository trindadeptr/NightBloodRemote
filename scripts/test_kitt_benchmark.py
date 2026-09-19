#!/usr/bin/env python3

from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "kitt_benchmark", ROOT / "scripts/kitt_benchmark.py"
)
assert SPEC and SPEC.loader
benchmark = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(benchmark)


class KittBenchmarkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.routing_document = json.loads(
            (ROOT / "benchmarks/kitt/routing_cases.json").read_text(encoding="utf-8")
        )
        cls.voice_document = json.loads(
            (ROOT / "benchmarks/kitt/voice_phrases.json").read_text(encoding="utf-8")
        )
        cls.cases = benchmark.validate_routing(copy.deepcopy(cls.routing_document))

    def predictions(self) -> dict:
        return {
            "schemaVersion": 1,
            "dataset": "kitt-routing",
            "datasetVersion": 1,
            "provenance": {
                "name": "unit-test oracle",
                "kind": "synthetic-evaluator-test",
                "details": "Generated from fixture labels to test evaluator arithmetic only.",
            },
            "predictions": [
                {
                    "id": case["id"],
                    "tier": case["acceptableTiers"][0],
                    "action": case["expectedAction"],
                }
                for case in self.cases
            ],
        }

    def prediction_for(self, document: dict, case_id: str) -> dict:
        return next(item for item in document["predictions"] if item["id"] == case_id)

    def test_checked_in_corpora_validate_with_required_counts(self) -> None:
        self.assertEqual(len(self.cases), 80)
        self.assertEqual(len(benchmark.validate_voice(copy.deepcopy(self.voice_document))), 40)

    def test_validation_only_report_has_no_runtime_scores_or_claims(self) -> None:
        report = benchmark.validation_report(self.cases, self.voice_document["phrases"])
        self.assertIsNone(report["evaluation"])
        self.assertFalse(report["claims"]["runtimeAccuracy"])
        self.assertFalse(report["claims"]["runtimeBaseline"])
        self.assertFalse(report["claims"]["costSavings"])

    def test_perfect_predictions_pass_all_decision_metrics(self) -> None:
        result = benchmark.evaluate(self.cases, self.predictions())
        self.assertTrue(result["safetyGate"]["passed"])
        self.assertEqual(result["metrics"]["routingAccuracy"]["value"], 1.0)
        self.assertEqual(result["metrics"]["decisionAccuracy"]["value"], 1.0)
        self.assertEqual(result["metrics"]["contextualFollowupAccuracy"]["value"], 1.0)
        self.assertEqual(result["metrics"]["ptPTAccuracy"]["value"], 1.0)
        self.assertEqual(result["metrics"]["enAccuracy"]["value"], 1.0)
        self.assertFalse(result["claims"]["runtimeBaseline"])

    def test_critical_local_downgrade_fails_safety_gate(self) -> None:
        predictions = self.predictions()
        item = self.prediction_for(predictions, "pt-mut-001")
        item["tier"] = "local"
        result = benchmark.evaluate(self.cases, predictions)
        self.assertFalse(result["safetyGate"]["passed"])
        self.assertEqual(result["safetyGate"]["criticalUnderRoutingCount"], 1)
        self.assertEqual(result["metrics"]["falseLocalRate"]["numerator"], 1)

    def test_wrong_critical_action_and_silent_clarification_fail_gate(self) -> None:
        predictions = self.predictions()
        item = self.prediction_for(predictions, "en-safe-001")
        item["action"] = "new"
        result = benchmark.evaluate(self.cases, predictions)
        self.assertFalse(result["safetyGate"]["passed"])
        self.assertEqual(result["safetyGate"]["criticalActionViolationCount"], 1)
        self.assertEqual(result["safetyGate"]["clarificationViolationCount"], 1)

    def test_context_accuracy_requires_tier_and_action(self) -> None:
        predictions = self.predictions()
        item = self.prediction_for(predictions, "pt-follow-001")
        item["action"] = "new"
        result = benchmark.evaluate(self.cases, predictions)
        self.assertEqual(result["metrics"]["routingAccuracy"]["value"], 1.0)
        self.assertLess(
            result["metrics"]["contextualFollowupAccuracy"]["value"], 1.0
        )

    def test_over_escalation_is_separate_from_false_local(self) -> None:
        predictions = self.predictions()
        item = self.prediction_for(predictions, "en-det-001")
        item["tier"] = "codex"
        result = benchmark.evaluate(self.cases, predictions)
        self.assertTrue(result["safetyGate"]["passed"])
        self.assertEqual(result["metrics"]["unnecessaryCodexRate"]["numerator"], 1)
        self.assertEqual(result["metrics"]["falseAppleRate"]["numerator"], 0)

    def test_prediction_coverage_rejects_missing_duplicate_and_extra_ids(self) -> None:
        missing = self.predictions()
        missing["predictions"].pop()
        with self.assertRaisesRegex(benchmark.ValidationError, "coverage mismatch"):
            benchmark.evaluate(self.cases, missing)

        duplicate = self.predictions()
        duplicate["predictions"].append(copy.deepcopy(duplicate["predictions"][0]))
        with self.assertRaisesRegex(benchmark.ValidationError, "duplicate prediction"):
            benchmark.evaluate(self.cases, duplicate)

        extra = self.predictions()
        extra["predictions"].append({"id": "unknown", "tier": "local", "action": "new"})
        with self.assertRaisesRegex(benchmark.ValidationError, "coverage mismatch"):
            benchmark.evaluate(self.cases, extra)

    def test_predictions_reject_invalid_tier_and_versions(self) -> None:
        invalid_tier = self.predictions()
        invalid_tier["predictions"][0]["tier"] = "browser"
        with self.assertRaisesRegex(benchmark.ValidationError, "invalid predicted tier"):
            benchmark.evaluate(self.cases, invalid_tier)

        invalid_version = self.predictions()
        invalid_version["datasetVersion"] = 2
        with self.assertRaisesRegex(benchmark.ValidationError, "incompatible"):
            benchmark.evaluate(self.cases, invalid_version)

        boolean_version = self.predictions()
        boolean_version["schemaVersion"] = True
        with self.assertRaisesRegex(benchmark.ValidationError, "incompatible"):
            benchmark.evaluate(self.cases, boolean_version)

    def test_malformed_fixture_values_fail_as_validation_errors(self) -> None:
        malformed = copy.deepcopy(self.routing_document)
        malformed["cases"][0]["acceptableTiers"] = [{"tier": "local"}]
        with self.assertRaises(benchmark.ValidationError):
            benchmark.validate_routing(malformed)

        duplicate_turn = copy.deepcopy(self.routing_document)
        duplicate_turn["cases"][1]["conversationState"] = copy.deepcopy(
            duplicate_turn["cases"][0].get("conversationState")
            or {
                "chainId": "duplicate",
                "turn": 1,
                "previousCaseId": None,
                "activeWork": False,
                "topicSwitch": False,
            }
        )
        duplicate_turn["cases"][0]["conversationState"] = copy.deepcopy(
            duplicate_turn["cases"][1]["conversationState"]
        )
        duplicate_turn["cases"][0]["contextual"] = True
        duplicate_turn["cases"][1]["contextual"] = True
        with self.assertRaisesRegex(benchmark.ValidationError, "duplicate chain turn"):
            benchmark.validate_routing(duplicate_turn)

    def test_corpus_content_version_is_validated_separately_from_schema(self) -> None:
        for document, validator in [
            (self.routing_document, benchmark.validate_routing),
            (self.voice_document, benchmark.validate_voice),
        ]:
            for version in [None, True, 1.0, 2]:
                changed = copy.deepcopy(document)
                changed["datasetVersion"] = version
                with self.assertRaisesRegex(benchmark.ValidationError, "datasetVersion"):
                    validator(changed)

    def test_cli_exit_codes_distinguish_unsafe_from_invalid_input(self) -> None:
        unsafe = self.predictions()
        self.prediction_for(unsafe, "pt-mut-001")["tier"] = "local"
        invalid = self.predictions()
        invalid["predictions"].pop()
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "predictions.json"
            for predictions, expected in [(self.predictions(), 0), (unsafe, 1), (invalid, 2)]:
                source.write_text(json.dumps(predictions), encoding="utf-8")
                result = subprocess.run(
                    [sys.executable, str(ROOT / "scripts/kitt_benchmark.py"),
                     "--predictions", str(source)],
                    capture_output=True, text=True, check=False,
                )
                self.assertEqual(result.returncode, expected, result.stderr)
                output = json.loads(result.stdout)
                if expected == 2:
                    self.assertEqual(output["resultType"], "validation-error")
                    self.assertNotIn("metrics", output)
                else:
                    self.assertEqual(output["safetyGate"]["passed"], expected == 0)
                    self.assertEqual(output["predictionProvenance"]["kind"],
                                     "synthetic-evaluator-test")

    def test_machine_readable_evaluation_contains_no_fixture_text(self) -> None:
        rendered = json.dumps(benchmark.evaluate(self.cases, self.predictions()))
        self.assertNotIn(self.cases[0]["utterance"], rendered)
        self.assertNotIn(self.cases[0]["rationale"], rendered)


if __name__ == "__main__":
    unittest.main()
