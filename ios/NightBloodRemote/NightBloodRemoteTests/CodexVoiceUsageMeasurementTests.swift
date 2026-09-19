import XCTest
@testable import NightBlood

final class CodexVoiceUsageMeasurementTests: XCTestCase {
    private func breakdown(
        input: Int64,
        cached: Int64,
        output: Int64,
        reasoning: Int64,
        total: Int64,
        cacheWrite: Int64? = nil
    ) -> CodexRemoteVoiceJSON {
        var object: [String: CodexRemoteVoiceJSON] = [
            "inputTokens": .integer(input),
            "cachedInputTokens": .integer(cached),
            "outputTokens": .integer(output),
            "reasoningOutputTokens": .integer(reasoning),
            "totalTokens": .integer(total),
        ]
        if let cacheWrite {
            object["cacheWriteInputTokens"] = .integer(cacheWrite)
        }
        return .object(object)
    }

    private func tokenParams(
        threadID: String = "source-task",
        last: CodexRemoteVoiceJSON? = nil,
        total: CodexRemoteVoiceJSON? = nil
    ) -> [String: CodexRemoteVoiceJSON] {
        let defaultBreakdown = breakdown(
            input: 6, cached: 2, output: 4, reasoning: 1, total: 10
        )
        let selectedTotal = total ?? defaultBreakdown
        return [
            "threadId": .string(threadID),
            "turnId": .string("synthetic-turn"),
            "tokenUsage": .object([
                "last": last ?? selectedTotal,
                "total": selectedTotal,
            ]),
        ]
    }

    private func summaries(
        _ measurement: inout CodexVoiceUsageMeasurement
    ) -> [String: String] {
        Dictionary(uniqueKeysWithValues: measurement.takeTerminalSummaries() ?? [])
    }

    func testTranscriptPartsAreValidatedCountedAndNeverRetained() {
        var measurement = CodexVoiceUsageMeasurement(startedAt: 10)
        XCTAssertTrue(measurement.recordFinalTranscriptPart(role: "user", text: "Olá"))
        XCTAssertTrue(measurement.recordFinalTranscriptPart(role: "assistant", text: "Ready"))
        XCTAssertFalse(measurement.recordFinalTranscriptPart(role: "tool", text: "private"))
        XCTAssertFalse(measurement.recordFinalTranscriptPart(role: "user", text: String(repeating: "a", count: 16_385)))

        let output = summaries(&measurement)
        let parts = output["voice.measure.parts"] ?? ""
        let partStatus = output["voice.measure.partStatus"] ?? ""
        let bytes = output["voice.measure.bytes"] ?? ""
        XCTAssertTrue(parts.contains("userParts=1"))
        XCTAssertTrue(parts.contains("assistantParts=1"))
        XCTAssertTrue(partStatus.contains("doneObs=4"))
        XCTAssertTrue(partStatus.contains("validParts=2"))
        XCTAssertTrue(partStatus.contains("invalidParts=2"))
        XCTAssertTrue(bytes.contains("userUTF8Bytes=4"))
        XCTAssertTrue(bytes.contains("assistantUTF8Bytes=5"))
        XCTAssertFalse(output.description.contains("Olá"))
        XCTAssertFalse(output.description.contains("private"))
    }

    func testReplayCountsRawObservationsAndBoundsIdentifiersAndCounters() {
        var measurement = CodexVoiceUsageMeasurement(
            startedAt: 0,
            identifierLimit: 2,
            eventCategoryLimit: 2,
            counterLimit: 3
        )
        measurement.increment("source.turn/started", uniqueID: "one")
        measurement.increment("source.turn/started", uniqueID: "one")
        measurement.increment("source.turn/started", uniqueID: "two")
        measurement.increment("source.turn/started", uniqueID: "three")
        measurement.increment("second")
        measurement.increment("third")
        let event = measurement.summary(for: "source.turn/started", at: 1)
        XCTAssertTrue(event.contains("observed=3"))
        XCTAssertTrue(event.contains("unique=2"))
        XCTAssertTrue(event.contains("capped=true"))
        XCTAssertFalse(event.contains("one"))
        let output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.aggregate"]?.contains("capped=true") == true)
    }

    func testTokenFirstSnapshotIsBaselineAndDuplicateCreatesValidZeroWindow() {
        var measurement = CodexVoiceUsageMeasurement()
        let params = tokenParams()
        XCTAssertTrue(measurement.observeTokenNotification(params, selectedThreadID: "source-task"))
        var output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("status=baselineOnly") == true)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("total=unavailable") == true)

        measurement = CodexVoiceUsageMeasurement()
        XCTAssertTrue(measurement.observeTokenNotification(params, selectedThreadID: "source-task"))
        XCTAssertTrue(measurement.observeTokenNotification(params, selectedThreadID: "source-task"))
        output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("status=observedWindow") == true)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("total=0") == true)
    }

    func testTokenGrowthUsesCumulativeDifferenceWithoutDoubleCountingSubsets() {
        var measurement = CodexVoiceUsageMeasurement()
        XCTAssertTrue(measurement.observeTokenNotification(
            tokenParams(total: breakdown(
                input: 10, cached: 3, output: 5, reasoning: 1,
                total: 15, cacheWrite: 2
            )),
            selectedThreadID: "source-task"
        ))
        XCTAssertTrue(measurement.observeTokenNotification(
            tokenParams(
                last: breakdown(
                    input: 4, cached: 1, output: 3, reasoning: 1, total: 7
                ),
                total: breakdown(
                    input: 14, cached: 4, output: 8, reasoning: 2,
                    total: 22, cacheWrite: 3
                )
            ),
            selectedThreadID: "source-task"
        ))
        let output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("total=7") == true)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("input=4") == true)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("output=3") == true)
        XCTAssertTrue(output["voice.measure.tokenSubsets"]?.contains("cachedInput=1") == true)
        XCTAssertTrue(output["voice.measure.tokenSubsets"]?.contains("reasoningOutput=1") == true)
        XCTAssertTrue(output["voice.measure.tokenSubsets"]?.contains("cacheWriteInput=1") == true)
    }

    func testTokenRegressionMakesWindowUnavailableAndStaysDiscontinuous() {
        var measurement = CodexVoiceUsageMeasurement()
        XCTAssertTrue(measurement.observeTokenNotification(
            tokenParams(total: breakdown(
                input: 10, cached: 2, output: 5, reasoning: 1, total: 15
            )), selectedThreadID: "source-task"
        ))
        XCTAssertTrue(measurement.observeTokenNotification(
            tokenParams(total: breakdown(
                input: 5, cached: 1, output: 3, reasoning: 1, total: 8
            )), selectedThreadID: "source-task"
        ))
        XCTAssertTrue(measurement.observeTokenNotification(
            tokenParams(total: breakdown(
                input: 6, cached: 1, output: 4, reasoning: 1, total: 10
            )), selectedThreadID: "source-task"
        ))
        let output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("status=discontinuous") == true)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("total=unavailable") == true)
    }

    func testImpossibleTokenSubsetDifferenceIsDiscontinuous() {
        var measurement = CodexVoiceUsageMeasurement()
        XCTAssertTrue(measurement.observeTokenNotification(
            tokenParams(total: breakdown(
                input: 10, cached: 0, output: 0, reasoning: 0, total: 10
            )), selectedThreadID: "source-task"
        ))
        XCTAssertTrue(measurement.observeTokenNotification(
            tokenParams(total: breakdown(
                input: 10, cached: 5, output: 0, reasoning: 0, total: 10
            )), selectedThreadID: "source-task"
        ))
        let output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("status=discontinuous") == true)
        XCTAssertTrue(output["voice.measure.tokenSubsets"]?.contains("cachedInput=unavailable") == true)
    }

    func testTokenValidationRejectsWrongScopeShapeAndNumericForms() {
        var measurement = CodexVoiceUsageMeasurement()
        XCTAssertFalse(measurement.observeTokenNotification(
            tokenParams(threadID: "other"), selectedThreadID: "source-task"
        ))
        XCTAssertFalse(measurement.observeTokenNotification(
            ["threadId": .string("source-task"), "usage": .object([:])],
            selectedThreadID: "source-task"
        ))
        XCTAssertFalse(measurement.observeTokenNotification(
            tokenParams(total: breakdown(
                input: -1, cached: 0, output: 1, reasoning: 0, total: 1
            )), selectedThreadID: "source-task"
        ))
        var fractional = tokenParams()
        fractional["tokenUsage"] = .object([
            "last": breakdown(input: 1, cached: 0, output: 1, reasoning: 0, total: 2),
            "total": .object([
                "inputTokens": .number(1.5),
                "cachedInputTokens": .integer(0),
                "outputTokens": .integer(1),
                "reasoningOutputTokens": .integer(0),
                "totalTokens": .integer(2),
            ]),
        ])
        XCTAssertFalse(measurement.observeTokenNotification(
            fractional, selectedThreadID: "source-task"
        ))
        var overflow = tokenParams()
        overflow["tokenUsage"] = .object([
            "last": breakdown(input: 1, cached: 0, output: 1, reasoning: 0, total: 2),
            "total": .object([
                "inputTokens": .number(Double.greatestFiniteMagnitude),
                "cachedInputTokens": .integer(0),
                "outputTokens": .integer(1),
                "reasoningOutputTokens": .integer(0),
                "totalTokens": .integer(Int64.max),
            ]),
        ])
        XCTAssertFalse(measurement.observeTokenNotification(
            overflow, selectedThreadID: "source-task"
        ))
        XCTAssertTrue(measurement.summary(for: "tokens.invalidOrOutOfScope").contains("observed=5"))
    }

    func testTokenCappingIsSticky() {
        var measurement = CodexVoiceUsageMeasurement(counterLimit: 3)
        XCTAssertTrue(measurement.observeTokenNotification(
            tokenParams(total: breakdown(
                input: 1, cached: 0, output: 1, reasoning: 0, total: 2
            )), selectedThreadID: "source-task"
        ))
        XCTAssertTrue(measurement.observeTokenNotification(
            tokenParams(total: breakdown(
                input: 4, cached: 0, output: 3, reasoning: 0, total: 7
            )), selectedThreadID: "source-task"
        ))
        XCTAssertTrue(measurement.observeTokenNotification(
            tokenParams(total: breakdown(
                input: 5, cached: 0, output: 3, reasoning: 0, total: 8
            )), selectedThreadID: "source-task"
        ))
        let output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("status=capped") == true)
        XCTAssertTrue(output["voice.measure.tokenTotal"]?.contains("total=unavailable") == true)
    }

    func testRealtimeUsesMonotonicClockAndTerminalFlushIsOneShot() {
        var measurement = CodexVoiceUsageMeasurement(startedAt: 90)
        measurement.realtimeStarted(at: 100)
        measurement.realtimeStarted(at: 120)
        XCTAssertTrue(measurement.realtimeEnded(clean: true, at: 125.75))
        XCTAssertFalse(measurement.realtimeEnded(clean: false, at: 140))
        let first = measurement.takeTerminalSummaries()
        XCTAssertNil(measurement.takeTerminalSummaries())
        let output = Dictionary(uniqueKeysWithValues: first ?? [])
        XCTAssertTrue(output["voice.measure.realtime"]?.contains("closure=clean") == true)
        XCTAssertTrue(output["voice.measure.realtime"]?.contains("elapsedMs=25750") == true)
    }

    func testInvalidClocksCannotTrapOrFabricateDuration() {
        var measurement = CodexVoiceUsageMeasurement(startedAt: .nan)
        measurement.realtimeStarted(at: .infinity)
        XCTAssertFalse(measurement.realtimeEnded(clean: false, at: .nan))
        XCTAssertTrue(measurement.summary(for: "session.started", at: .infinity).contains("elapsedMs=unavailable"))
        let output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.realtime"]?.contains("closure=unavailable") == true)
    }

    func testInterruptedRealtimeDurationIsExplicit() {
        var measurement = CodexVoiceUsageMeasurement()
        measurement.realtimeStarted(at: 50)
        XCTAssertTrue(measurement.realtimeEnded(clean: false, at: 51.25))
        let output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.realtime"]?.contains("closure=interrupted") == true)
        XCTAssertTrue(output["voice.measure.realtime"]?.contains("elapsedMs=1250") == true)
    }

    func testMonotonicClockRegressionDoesNotFabricateZeroDuration() {
        var measurement = CodexVoiceUsageMeasurement()
        measurement.realtimeStarted(at: 100)
        XCTAssertFalse(measurement.realtimeEnded(clean: true, at: 99))
        let output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.realtime"]?.contains("closure=interrupted") == true)
        XCTAssertTrue(output["voice.measure.realtime"]?.contains("elapsedMs=unavailable") == true)
    }

    func testZeroEventCategoryLimitStaysBounded() {
        var measurement = CodexVoiceUsageMeasurement(eventCategoryLimit: 0)
        for index in 0..<1_000 {
            measurement.increment("untrusted-\(index)")
        }
        let output = summaries(&measurement)
        XCTAssertTrue(output["voice.measure.aggregate"]?.contains("eventCategories=0") == true)
        XCTAssertTrue(output["voice.measure.aggregate"]?.contains("capped=true") == true)
    }

    func testEveryPersistedDetailFitsDiagnosticsLimitAndSharesSample() {
        var measurement = CodexVoiceUsageMeasurement()
        measurement.increment("source.turn/started", by: UInt64.max, uniqueID: "private-source-id")
        measurement.increment("source.turn/completed", by: UInt64.max, uniqueID: "private-source-id")
        measurement.increment("created.turn/started", by: UInt64.max, uniqueID: "private-created-id")
        measurement.increment("created.turn/completed", by: UInt64.max, uniqueID: "private-created-id")
        measurement.increment("transcript.done", by: UInt64.max)
        measurement.increment("transcript.final.valid", by: UInt64.max)
        measurement.increment("transcript.final.user.parts", by: UInt64.max)
        measurement.increment("transcript.final.assistant.parts", by: UInt64.max)
        measurement.increment("transcript.final.invalid", by: UInt64.max)
        measurement.increment("transcript.final.user.bytes", by: UInt64.max)
        measurement.increment("transcript.final.assistant.bytes", by: UInt64.max)
        measurement.increment("transcript.done")
        measurement.increment("transcript.final.user.bytes")
        let maximum = breakdown(
            input: Int64.max, cached: Int64.max, output: 0,
            reasoning: 0, total: Int64.max, cacheWrite: Int64.max
        )
        let zero = breakdown(
            input: 0, cached: 0, output: 0,
            reasoning: 0, total: 0, cacheWrite: 0
        )
        measurement.observeTokenNotification(
            tokenParams(last: zero, total: zero),
            selectedThreadID: "source-task"
        )
        measurement.observeTokenNotification(
            tokenParams(last: maximum, total: maximum),
            selectedThreadID: "source-task"
        )
        measurement.realtimeStarted(at: 1)
        measurement.realtimeEnded(clean: false, at: 2)
        let output = measurement.takeTerminalSummaries() ?? []
        XCTAssertFalse(output.isEmpty)
        XCTAssertTrue(output.allSatisfy { $0.1.count <= 160 })
        let sampleValues = output.compactMap { _, detail in
            detail.split(separator: " ").first.map(String.init)
        }
        XCTAssertEqual(Set(sampleValues).count, 1)
        XCTAssertFalse(output.description.contains("private-source-id"))
        XCTAssertFalse(output.description.contains("private-created-id"))
    }
}
