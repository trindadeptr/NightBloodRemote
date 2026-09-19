#!/usr/bin/env python3
"""Validate KITT benchmark corpora and evaluate supplied routing predictions."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


SCHEMA_VERSION = 1
DATASET_VERSION = 1
TIERS = ("local", "apple", "live", "codex")
TIER_RANK = {tier: rank for rank, tier in enumerate(TIERS)}
ACTIONS = ("new", "steer", "clarify", "fallback")
LANGUAGES = ("pt-PT", "en")
ROUTING_CATEGORIES = {
    "deterministic",
    "conversation",
    "fresh-information",
    "project-question",
    "mutation",
    "ambiguous",
    "follow-up",
    "capability-fallback",
    "safety-protocol",
    "car-noise",
}
VOICE_CATEGORIES = {
    "ordinary",
    "technical",
    "numbers",
    "question",
    "kitt-style",
    "summary",
    "pronunciation",
    "interruption",
    "consecutive-playback",
}


class ValidationError(ValueError):
    """Raised when an input cannot support a complete, trustworthy result."""


def _load(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValidationError(f"cannot read {path}: {error}") from error
    if not isinstance(value, dict):
        raise ValidationError(f"{path} must contain a JSON object")
    return value


def _require_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"{field} must be a non-empty string")
    return value


def _require_bool(value: Any, field: str) -> bool:
    if not isinstance(value, bool):
        raise ValidationError(f"{field} must be a boolean")
    return value


def _check_header(document: dict[str, Any], dataset: str, item_key: str) -> list[Any]:
    version = document.get("schemaVersion")
    if isinstance(version, bool) or version != SCHEMA_VERSION:
        raise ValidationError(
            f"{dataset} schemaVersion must be {SCHEMA_VERSION}"
        )
    content_version = document.get("datasetVersion")
    if type(content_version) is not int or content_version != DATASET_VERSION:
        raise ValidationError(f"{dataset} datasetVersion is incompatible")
    if document.get("dataset") != dataset:
        raise ValidationError(f"dataset must be {dataset!r}")
    review_status = document.get("reviewStatus")
    if review_status not in ("pending-human-review", "human-reviewed"):
        raise ValidationError("reviewStatus is unsupported")
    if review_status == "human-reviewed":
        provenance = document.get("reviewProvenance")
        if not isinstance(provenance, dict):
            raise ValidationError("human-reviewed data requires reviewProvenance")
        _require_string(provenance.get("reviewer"), "reviewProvenance.reviewer")
        _require_string(provenance.get("reviewedAt"), "reviewProvenance.reviewedAt")
    items = document.get(item_key)
    if not isinstance(items, list):
        raise ValidationError(f"{item_key} must be an array")
    return items


def validate_routing(document: dict[str, Any]) -> list[dict[str, Any]]:
    cases = _check_header(document, "kitt-routing", "cases")
    if not 50 <= len(cases) <= 100:
        raise ValidationError("routing corpus must contain 50-100 cases")

    seen: set[str] = set()
    categories: set[str] = set()
    languages: set[str] = set()
    actions: set[str] = set()
    chain_ids: set[str] = set()
    chain_turns: dict[tuple[str, int], dict[str, Any]] = {}
    normalized: list[dict[str, Any]] = []
    for index, case in enumerate(cases):
        prefix = f"cases[{index}]"
        if not isinstance(case, dict):
            raise ValidationError(f"{prefix} must be an object")
        case_id = _require_string(case.get("id"), f"{prefix}.id")
        if case_id in seen:
            raise ValidationError(f"duplicate routing case id: {case_id}")
        seen.add(case_id)
        language = case.get("language")
        if language not in LANGUAGES:
            raise ValidationError(f"{case_id}: unsupported language {language!r}")
        category = case.get("category")
        if category not in ROUTING_CATEGORIES:
            raise ValidationError(f"{case_id}: unsupported category {category!r}")
        _require_string(case.get("utterance"), f"{case_id}.utterance")
        _require_string(case.get("rationale"), f"{case_id}.rationale")
        minimum = case.get("expectedMinimumTier")
        if minimum not in TIERS:
            raise ValidationError(f"{case_id}: invalid expectedMinimumTier")
        acceptable = case.get("acceptableTiers")
        if (
            not isinstance(acceptable, list)
            or not acceptable
            or any(tier not in TIERS for tier in acceptable)
        ):
            raise ValidationError(f"{case_id}: invalid acceptableTiers")
        if len(acceptable) != len(set(acceptable)):
            raise ValidationError(f"{case_id}: duplicate acceptable tier")
        if minimum not in acceptable:
            raise ValidationError(f"{case_id}: minimum tier must be acceptable")
        if any(TIER_RANK[tier] < TIER_RANK[minimum] for tier in acceptable):
            raise ValidationError(f"{case_id}: acceptable tier is below minimum")
        action = case.get("expectedAction")
        if action not in ACTIONS:
            raise ValidationError(f"{case_id}: invalid expectedAction")
        _require_bool(case.get("critical"), f"{case_id}.critical")
        contextual = _require_bool(case.get("contextual"), f"{case_id}.contextual")
        context = case.get("conversationState")
        if context is not None:
            if not isinstance(context, dict):
                raise ValidationError(f"{case_id}: conversationState must be object/null")
            allowed = {
                "chainId", "turn", "previousCaseId", "activeWork", "activeWorkKind",
                "topicSwitch", "capabilityStatus", "mutationOutcome",
            }
            if set(context) - allowed:
                raise ValidationError(f"{case_id}: unbounded conversationState keys")
            chain_id = _require_string(context.get("chainId"), f"{case_id}.chainId")
            chain_ids.add(chain_id)
            turn = context.get("turn")
            if not isinstance(turn, int) or isinstance(turn, bool) or not 1 <= turn <= 6:
                raise ValidationError(f"{case_id}: turn must be an integer from 1 to 6")
            _require_bool(context.get("activeWork"), f"{case_id}.activeWork")
            _require_bool(context.get("topicSwitch"), f"{case_id}.topicSwitch")
            if context.get("activeWorkKind") not in (None, "project", "conversation"):
                raise ValidationError(f"{case_id}: invalid activeWorkKind")
            if context.get("capabilityStatus") not in (None, "available", "unavailable"):
                raise ValidationError(f"{case_id}: invalid capabilityStatus")
            if context.get("mutationOutcome") not in (None, "known", "unknown"):
                raise ValidationError(f"{case_id}: invalid mutationOutcome")
            previous = context.get("previousCaseId")
            if turn == 1 and previous is not None:
                raise ValidationError(f"{case_id}: first turn cannot have previousCaseId")
            if turn > 1:
                _require_string(previous, f"{case_id}.previousCaseId")
            if not contextual:
                raise ValidationError(f"{case_id}: context requires contextual=true")
            key = (chain_id, turn)
            if key in chain_turns:
                raise ValidationError(f"duplicate chain turn: {chain_id}/{turn}")
            chain_turns[key] = case
        elif contextual:
            raise ValidationError(f"{case_id}: contextual case requires conversationState")
        categories.add(category)
        languages.add(language)
        actions.add(action)
        normalized.append(case)

    cases_by_id = {case["id"]: case for case in normalized}
    for case in normalized:
        context = case.get("conversationState")
        if context and context.get("previousCaseId") is not None:
            previous_id = context["previousCaseId"]
            previous_case = cases_by_id.get(previous_id)
            if previous_case is None:
                raise ValidationError(f"{case['id']}: unknown previousCaseId {previous_id}")
            previous_context = previous_case.get("conversationState")
            if not previous_context:
                raise ValidationError(f"{case['id']}: predecessor lacks chain metadata")
            if previous_context["chainId"] != context["chainId"]:
                raise ValidationError(f"{case['id']}: predecessor belongs to another chain")
            if previous_context["turn"] != context["turn"] - 1:
                raise ValidationError(f"{case['id']}: predecessor is not the prior turn")
    missing_categories = ROUTING_CATEGORIES - categories
    if missing_categories:
        raise ValidationError(f"missing routing categories: {sorted(missing_categories)}")
    if languages != set(LANGUAGES):
        raise ValidationError("routing corpus must cover pt-PT and en")
    if actions != set(ACTIONS):
        raise ValidationError("routing corpus must cover every expected action")
    if len(chain_ids) < 4:
        raise ValidationError("routing corpus must contain at least four follow-up chains")
    return normalized


def validate_voice(document: dict[str, Any]) -> list[dict[str, Any]]:
    phrases = _check_header(document, "kitt-voice", "phrases")
    if not 30 <= len(phrases) <= 50:
        raise ValidationError("voice corpus must contain 30-50 phrases")
    seen: set[str] = set()
    categories: set[str] = set()
    languages: set[str] = set()
    for index, phrase in enumerate(phrases):
        prefix = f"phrases[{index}]"
        if not isinstance(phrase, dict):
            raise ValidationError(f"{prefix} must be an object")
        phrase_id = _require_string(phrase.get("id"), f"{prefix}.id")
        if phrase_id in seen:
            raise ValidationError(f"duplicate voice phrase id: {phrase_id}")
        seen.add(phrase_id)
        language = phrase.get("language")
        if language not in LANGUAGES:
            raise ValidationError(f"{phrase_id}: unsupported language")
        category = phrase.get("category")
        if category not in VOICE_CATEGORIES:
            raise ValidationError(f"{phrase_id}: unsupported category")
        _require_string(phrase.get("text"), f"{phrase_id}.text")
        tags = phrase.get("tags")
        if (
            not isinstance(tags, list)
            or not tags
            or len(tags) > 6
            or any(not isinstance(tag, str) or not tag for tag in tags)
        ):
            raise ValidationError(f"{phrase_id}: tags must contain 1-6 strings")
        phrase_status = phrase.get("humanReviewStatus")
        if phrase_status == "pending":
            if phrase.get("humanScores") is not None:
                raise ValidationError(f"{phrase_id}: pending humanScores must be null")
        elif phrase_status == "reviewed":
            if not isinstance(phrase.get("humanScores"), dict):
                raise ValidationError(f"{phrase_id}: reviewed phrase requires humanScores")
            if not isinstance(phrase.get("reviewProvenance"), dict):
                raise ValidationError(f"{phrase_id}: reviewed phrase requires provenance")
        else:
            raise ValidationError(f"{phrase_id}: invalid humanReviewStatus")
        categories.add(category)
        languages.add(language)
    missing_categories = VOICE_CATEGORIES - categories
    if missing_categories:
        raise ValidationError(f"missing voice categories: {sorted(missing_categories)}")
    if languages != set(LANGUAGES):
        raise ValidationError("voice corpus must cover pt-PT and en")
    return phrases


def _ratio(numerator: int, denominator: int) -> dict[str, Any]:
    return {
        "numerator": numerator,
        "denominator": denominator,
        "value": None if denominator == 0 else numerator / denominator,
    }


def evaluate(cases: list[dict[str, Any]], predictions_doc: dict[str, Any]) -> dict[str, Any]:
    prediction_version = predictions_doc.get("schemaVersion")
    if type(prediction_version) is not int or prediction_version != SCHEMA_VERSION:
        raise ValidationError("prediction schemaVersion is incompatible")
    if predictions_doc.get("dataset") != "kitt-routing":
        raise ValidationError("predictions must target kitt-routing")
    dataset_version = predictions_doc.get("datasetVersion")
    if type(dataset_version) is not int or dataset_version != DATASET_VERSION:
        raise ValidationError("prediction datasetVersion is incompatible")
    provenance = predictions_doc.get("provenance")
    if not isinstance(provenance, dict):
        raise ValidationError("predictions require provenance")
    provenance_name = _require_string(provenance.get("name"), "provenance.name")
    provenance_kind = provenance.get("kind")
    if provenance_kind not in ("runtime-candidate", "synthetic-evaluator-test"):
        raise ValidationError("provenance.kind is unsupported")
    _require_string(provenance.get("details"), "provenance.details")

    predictions = predictions_doc.get("predictions")
    if not isinstance(predictions, list):
        raise ValidationError("predictions must be an array")
    by_id: dict[str, dict[str, Any]] = {}
    for index, prediction in enumerate(predictions):
        if not isinstance(prediction, dict):
            raise ValidationError(f"predictions[{index}] must be an object")
        case_id = _require_string(prediction.get("id"), f"predictions[{index}].id")
        if case_id in by_id:
            raise ValidationError(f"duplicate prediction id: {case_id}")
        if prediction.get("tier") not in TIERS:
            raise ValidationError(f"{case_id}: invalid predicted tier")
        if prediction.get("action") not in ACTIONS:
            raise ValidationError(f"{case_id}: invalid predicted action")
        by_id[case_id] = prediction

    expected_ids = {case["id"] for case in cases}
    missing = sorted(expected_ids - set(by_id))
    extra = sorted(set(by_id) - expected_ids)
    if missing or extra:
        raise ValidationError(
            f"prediction coverage mismatch: missing={missing}, extra={extra}"
        )

    total = len(cases)
    route_correct = action_correct = decision_correct = 0
    false_local = false_apple = unnecessary_live = unnecessary_codex = 0
    critical_under = clarification_violations = critical_action_violations = 0
    contextual_total = contextual_correct = 0
    language_counts = {language: [0, 0] for language in LANGUAGES}
    for case in cases:
        prediction = by_id[case["id"]]
        tier = prediction["tier"]
        action = prediction["action"]
        accepted = tier in case["acceptableTiers"]
        correct_action = action == case["expectedAction"]
        correct_decision = accepted and correct_action
        route_correct += int(accepted)
        action_correct += int(correct_action)
        decision_correct += int(correct_decision)
        false_local += int(
            tier == "local" and TIER_RANK[tier] < TIER_RANK[case["expectedMinimumTier"]]
        )
        false_apple += int(
            tier == "apple" and TIER_RANK[tier] < TIER_RANK[case["expectedMinimumTier"]]
        )
        cheaper_acceptable = any(
            TIER_RANK[candidate] < TIER_RANK[tier]
            for candidate in case["acceptableTiers"]
        )
        unnecessary_live += int(tier == "live" and cheaper_acceptable)
        unnecessary_codex += int(tier == "codex" and cheaper_acceptable)
        critical_under += int(
            case["critical"]
            and TIER_RANK[tier] < TIER_RANK[case["expectedMinimumTier"]]
        )
        clarification_violations += int(
            case["expectedAction"] == "clarify" and action != "clarify"
        )
        critical_action_violations += int(
            case["critical"] and action != case["expectedAction"]
        )
        if case["contextual"]:
            contextual_total += 1
            contextual_correct += int(correct_decision)
        language_counts[case["language"]][1] += 1
        language_counts[case["language"]][0] += int(correct_decision)

    safety_passed = (
        critical_under == 0
        and clarification_violations == 0
        and critical_action_violations == 0
    )
    return {
        "resultType": "routing-evaluation",
        "schemaVersion": SCHEMA_VERSION,
        "datasetVersion": DATASET_VERSION,
        "predictionProvenance": {
            "name": provenance_name,
            "kind": provenance_kind,
        },
        "caseCount": total,
        "metrics": {
            "routingAccuracy": _ratio(route_correct, total),
            "actionAccuracy": _ratio(action_correct, total),
            "decisionAccuracy": _ratio(decision_correct, total),
            "falseLocalRate": _ratio(false_local, total),
            "falseAppleRate": _ratio(false_apple, total),
            "unnecessaryLiveRate": _ratio(unnecessary_live, total),
            "unnecessaryCodexRate": _ratio(unnecessary_codex, total),
            "contextualFollowupAccuracy": _ratio(contextual_correct, contextual_total),
            "ptPTAccuracy": _ratio(*language_counts["pt-PT"]),
            "enAccuracy": _ratio(*language_counts["en"]),
            "criticalUnderRoutingRate": _ratio(
                critical_under, sum(int(case["critical"]) for case in cases)
            ),
            "clarificationViolationRate": _ratio(
                clarification_violations,
                sum(int(case["expectedAction"] == "clarify") for case in cases),
            ),
            "criticalActionViolationRate": _ratio(
                critical_action_violations,
                sum(int(case["critical"]) for case in cases),
            ),
        },
        "safetyGate": {
            "passed": safety_passed,
            "criticalUnderRoutingCount": critical_under,
            "clarificationViolationCount": clarification_violations,
            "criticalActionViolationCount": critical_action_violations,
        },
        "claims": {
            "runtimeBaseline": False,
            "costSavings": False,
            "humanReviewed": False,
        },
    }


def validation_report(
    routing_cases: list[dict[str, Any]], voice_phrases: list[dict[str, Any]]
) -> dict[str, Any]:
    return {
        "resultType": "fixture-validation",
        "schemaVersion": SCHEMA_VERSION,
        "valid": True,
        "datasetVersion": DATASET_VERSION,
        "routingCaseCount": len(routing_cases),
        "voicePhraseCount": len(voice_phrases),
        "reviewStatus": "pending-human-review",
        "evaluation": None,
        "claims": {
            "runtimeAccuracy": False,
            "runtimeBaseline": False,
            "costSavings": False,
            "voiceQualityMeasured": False,
        },
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--routing",
        type=Path,
        default=root / "benchmarks/kitt/routing_cases.json",
    )
    parser.add_argument(
        "--voice",
        type=Path,
        default=root / "benchmarks/kitt/voice_phrases.json",
    )
    parser.add_argument("--predictions", type=Path)
    parser.add_argument("--output", type=Path)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        routing_cases = validate_routing(_load(args.routing))
        voice_phrases = validate_voice(_load(args.voice))
        if args.predictions is None:
            result = validation_report(routing_cases, voice_phrases)
            exit_code = 0
        else:
            result = evaluate(routing_cases, _load(args.predictions))
            exit_code = 0 if result["safetyGate"]["passed"] else 1
    except ValidationError as error:
        result = {
            "resultType": "validation-error",
            "schemaVersion": SCHEMA_VERSION,
            "valid": False,
            "error": str(error),
        }
        exit_code = 2
    rendered = json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True)
    if args.output:
        args.output.write_text(rendered + "\n", encoding="utf-8")
    else:
        print(rendered)
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
