import Foundation

/// Bounded, transport-lifetime protocol evidence. It never retains transcript
/// text or persists the identifiers used to distinguish replayed notifications.
struct CodexVoiceUsageMeasurement {
    private struct TokenBreakdown: Equatable {
        let input: UInt64
        let cachedInput: UInt64
        let output: UInt64
        let reasoningOutput: UInt64
        let total: UInt64
        let cacheWriteInput: UInt64

        static func parse(_ value: CodexRemoteVoiceJSON?) -> Self? {
            guard let object = value?.objectValue,
                  let input = unsignedInteger(object["inputTokens"]),
                  let cachedInput = unsignedInteger(object["cachedInputTokens"]),
                  let output = unsignedInteger(object["outputTokens"]),
                  let reasoningOutput = unsignedInteger(object["reasoningOutputTokens"]),
                  let total = unsignedInteger(object["totalTokens"])
            else {
                return nil
            }
            let cacheWriteInput: UInt64
            if object["cacheWriteInputTokens"] == nil {
                cacheWriteInput = 0
            } else if let value = unsignedInteger(object["cacheWriteInputTokens"]) {
                cacheWriteInput = value
            } else {
                return nil
            }
            let parsed = Self(
                input: input,
                cachedInput: cachedInput,
                output: output,
                reasoningOutput: reasoningOutput,
                total: total,
                cacheWriteInput: cacheWriteInput
            )
            guard parsed.hasConsistentBounds else {
                return nil
            }
            return parsed
        }

        private static func unsignedInteger(
            _ value: CodexRemoteVoiceJSON?
        ) -> UInt64? {
            guard let value,
                  case .integer(let integer) = value,
                  integer >= 0
            else {
                return nil
            }
            return UInt64(integer)
        }

        func isAtLeast(_ other: Self) -> Bool {
            input >= other.input
                && cachedInput >= other.cachedInput
                && output >= other.output
                && reasoningOutput >= other.reasoningOutput
                && total >= other.total
                && cacheWriteInput >= other.cacheWriteInput
        }

        var hasConsistentBounds: Bool {
            total >= input
                && total >= output
                && cachedInput <= input
                && cacheWriteInput <= input
                && reasoningOutput <= output
        }

        func subtracting(_ other: Self) -> Self {
            Self(
                input: input - other.input,
                cachedInput: cachedInput - other.cachedInput,
                output: output - other.output,
                reasoningOutput: reasoningOutput - other.reasoningOutput,
                total: total - other.total,
                cacheWriteInput: cacheWriteInput - other.cacheWriteInput
            )
        }
    }

    private enum TokenCoverage: String {
        case unavailable
        case baselineOnly
        case observedWindow
        case discontinuous
        case capped
    }

    private enum RealtimeClosure: String {
        case open
        case clean
        case interrupted
    }

    private var counts: [String: UInt64] = [:]
    private var identifiers: [String: Set<String>] = [:]
    private var identifierCount = 0
    private var saturated: Set<String> = []
    private var tokenBaseline: TokenBreakdown?
    private var observedTokens = TokenBreakdown(
        input: 0,
        cachedInput: 0,
        output: 0,
        reasoningOutput: 0,
        total: 0,
        cacheWriteInput: 0
    )
    private var tokenCoverage: TokenCoverage = .unavailable
    private var realtimeOpenedAt: TimeInterval?
    private var realtimeElapsedMs: UInt64?
    private var realtimeClosure: RealtimeClosure?
    private var terminalDiagnosticsTaken = false
    private let startedAt: TimeInterval
    private let sample = String(UUID().uuidString.prefix(8)).lowercased()
    private let identifierLimit: Int
    private let eventCategoryLimit: Int
    private let counterLimit: UInt64
    private var eventCategoriesCapped = false

    init(
        startedAt: TimeInterval = ProcessInfo.processInfo.systemUptime,
        identifierLimit: Int = 4096,
        eventCategoryLimit: Int = 128,
        counterLimit: UInt64 = UInt64.max
    ) {
        self.startedAt = startedAt
        self.identifierLimit = max(0, identifierLimit)
        self.eventCategoryLimit = max(0, eventCategoryLimit)
        self.counterLimit = counterLimit
    }

    mutating func increment(
        _ event: String,
        by amount: UInt64 = 1,
        uniqueID: String? = nil
    ) {
        guard add(amount, to: event) else { return }
        guard let uniqueID else { return }
        if identifiers[event, default: []].contains(uniqueID) { return }
        guard identifierCount < identifierLimit else {
            saturated.insert(event)
            return
        }
        identifiers[event, default: []].insert(uniqueID)
        identifierCount += 1
    }

    /// Counts validated finalized transcript parts and bytes without retaining
    /// their content. A part is not a user turn and cannot be deduplicated.
    mutating func recordFinalTranscriptPart(
        role: String?,
        text: String?,
        maximumBytes: Int = 16_384
    ) -> Bool {
        increment("transcript.done")
        guard let role,
              role == "user" || role == "assistant",
              let text,
              text.utf8.count <= maximumBytes
        else {
            increment("transcript.final.invalid")
            return false
        }
        increment("transcript.final.valid")
        increment("transcript.final.\(role).parts")
        increment("transcript.final.\(role).bytes", by: UInt64(text.utf8.count))
        return true
    }

    /// Observes only the inspected v2 camelCase notification schema for the
    /// selected source task. The first total is a baseline, not consumption.
    @discardableResult
    mutating func observeTokenNotification(
        _ params: [String: CodexRemoteVoiceJSON],
        selectedThreadID: String?
    ) -> Bool {
        increment("tokens.observed")
        guard let selectedThreadID,
              params["threadId"]?.stringValue == selectedThreadID,
              let turnID = params["turnId"]?.stringValue,
              !turnID.isEmpty,
              turnID.utf8.count <= 1_024,
              let usage = params["tokenUsage"]?.objectValue,
              let last = TokenBreakdown.parse(usage["last"]),
              let total = TokenBreakdown.parse(usage["total"]),
              total.isAtLeast(last)
        else {
            increment("tokens.invalidOrOutOfScope")
            return false
        }
        increment("tokens.valid")
        guard let previous = tokenBaseline else {
            tokenBaseline = total
            tokenCoverage = .baselineOnly
            return true
        }
        guard total.isAtLeast(previous) else {
            tokenCoverage = .discontinuous
            tokenBaseline = total
            return true
        }
        let difference = total.subtracting(previous)
        tokenBaseline = total
        guard difference.hasConsistentBounds else {
            tokenCoverage = .discontinuous
            return true
        }
        guard tokenCoverage != .discontinuous,
              tokenCoverage != .capped
        else {
            return true
        }
        guard addTokenDifference(difference) else {
            tokenCoverage = .capped
            return true
        }
        tokenCoverage = .observedWindow
        return true
    }

    mutating func realtimeStarted(at uptime: TimeInterval) {
        increment("session.started")
        guard uptime.isFinite,
              uptime >= 0,
              realtimeOpenedAt == nil,
              realtimeClosure == nil
        else {
            return
        }
        realtimeOpenedAt = uptime
        realtimeClosure = .open
    }

    /// Returns false for duplicate terminal observations.
    @discardableResult
    mutating func realtimeEnded(clean: Bool, at uptime: TimeInterval) -> Bool {
        guard uptime.isFinite,
              uptime >= 0,
              let openedAt = realtimeOpenedAt,
              realtimeClosure == .open
        else {
            return false
        }
        guard uptime >= openedAt else {
            realtimeElapsedMs = nil
            realtimeClosure = .interrupted
            return false
        }
        let elapsed = max(0, uptime - openedAt) * 1_000
        realtimeElapsedMs = elapsed >= Double(UInt64.max)
            ? UInt64.max : UInt64(elapsed.rounded(.down))
        realtimeClosure = clean ? .clean : .interrupted
        return true
    }

    /// A terminal transport path emits one bounded aggregate set only.
    mutating func takeTerminalSummaries() -> [(String, String)]? {
        guard !terminalDiagnosticsTaken else { return nil }
        terminalDiagnosticsTaken = true
        let capped = !saturated.isEmpty || eventCategoriesCapped
        return [
            (
                "voice.measure.aggregate",
                "sample=\(sample) scope=transportLifetime eventCategories=\(counts.count) capped=\(capped)"
            ),
            (
                "voice.measure.rpc",
                "sample=\(sample) realtimeStartAttempts=\(count("rpc.attempted.thread/realtime/start")) turnStartAttempts=\(count("rpc.attempted.turn/start")) capped=\(capped)"
            ),
            (
                "voice.measure.sourceTurns",
                "sample=\(sample) sObs=\(count("source.turn/started")) sUnique=\(uniqueCount("source.turn/started")) cObs=\(count("source.turn/completed")) cUnique=\(uniqueCount("source.turn/completed")) capped=\(capped)"
            ),
            (
                "voice.measure.createdTurns",
                "sample=\(sample) sObs=\(count("created.turn/started")) sUnique=\(uniqueCount("created.turn/started")) cObs=\(count("created.turn/completed")) cUnique=\(uniqueCount("created.turn/completed")) capped=\(capped)"
            ),
            (
                "voice.measure.parts",
                "sample=\(sample) userParts=\(count("transcript.final.user.parts")) assistantParts=\(count("transcript.final.assistant.parts")) capped=\(transcriptCapped)"
            ),
            (
                "voice.measure.partStatus",
                "sample=\(sample) doneObs=\(count("transcript.done")) validParts=\(count("transcript.final.valid")) invalidParts=\(count("transcript.final.invalid")) capped=\(transcriptCapped)"
            ),
            (
                "voice.measure.bytes",
                "sample=\(sample) userUTF8Bytes=\(count("transcript.final.user.bytes")) assistantUTF8Bytes=\(count("transcript.final.assistant.bytes")) capped=\(transcriptCapped)"
            ),
            ("voice.measure.tokenTotal", tokenTotalSummary),
            ("voice.measure.tokenSubsets", tokenSubsetSummary),
            ("voice.measure.realtime", realtimeSummary),
        ]
    }

    func summary(
        for event: String,
        at uptime: TimeInterval = ProcessInfo.processInfo.systemUptime
    ) -> String {
        let elapsedText: String
        if uptime.isFinite, startedAt.isFinite {
            let elapsed = max(0, uptime - startedAt) * 1_000
            elapsedText = elapsed.isFinite && elapsed < Double(UInt64.max)
                ? String(UInt64(elapsed.rounded(.down))) : "unavailable"
        } else {
            elapsedText = "unavailable"
        }
        let capped = saturated.contains(event)
            || (counts[event] == nil && eventCategoriesCapped)
        return "sample=\(sample) scope=transport observed=\(count(event)) unique=\(uniqueCount(event)) capped=\(capped) elapsedMs=\(elapsedText)"
    }

    private var transcriptCapped: Bool {
        eventCategoriesCapped
            || saturated.contains { $0.hasPrefix("transcript.") }
    }

    private var tokenValuesAvailable: Bool {
        tokenCoverage == .observedWindow
    }

    private func tokenValue(_ value: UInt64) -> String {
        tokenValuesAvailable ? String(value) : "unavailable"
    }

    private var tokenTotalSummary: String {
        "sample=\(sample) scope=sourceWindow status=\(tokenCoverage.rawValue) total=\(tokenValue(observedTokens.total)) input=\(tokenValue(observedTokens.input)) output=\(tokenValue(observedTokens.output))"
    }

    private var tokenSubsetSummary: String {
        "sample=\(sample) status=\(tokenCoverage.rawValue) cachedInput=\(tokenValue(observedTokens.cachedInput)) reasoningOutput=\(tokenValue(observedTokens.reasoningOutput)) cacheWriteInput=\(tokenValue(observedTokens.cacheWriteInput))"
    }

    private var realtimeSummary: String {
        let closure = realtimeClosure?.rawValue ?? "unavailable"
        let elapsed = realtimeElapsedMs.map(String.init) ?? "unavailable"
        return "sample=\(sample) basis=monotonicExposure closure=\(closure) elapsedMs=\(elapsed) billableAudio=unavailable"
    }

    private func count(_ event: String) -> UInt64 {
        counts[event] ?? 0
    }

    private func uniqueCount(_ event: String) -> Int {
        identifiers[event]?.count ?? 0
    }

    @discardableResult
    private mutating func add(_ amount: UInt64, to event: String) -> Bool {
        if counts[event] == nil {
            guard counts.count < eventCategoryLimit else {
                eventCategoriesCapped = true
                return false
            }
            counts[event] = 0
        }
        let current = counts[event, default: 0]
        guard current < counterLimit else {
            saturated.insert(event)
            return true
        }
        let (sum, overflow) = current.addingReportingOverflow(amount)
        if overflow || sum > counterLimit {
            counts[event] = counterLimit
            saturated.insert(event)
        } else {
            counts[event] = sum
        }
        return true
    }

    private mutating func addTokenDifference(_ difference: TokenBreakdown) -> Bool {
        func adding(_ left: UInt64, _ right: UInt64) -> UInt64? {
            let (sum, overflow) = left.addingReportingOverflow(right)
            return overflow || sum > counterLimit ? nil : sum
        }
        guard let input = adding(observedTokens.input, difference.input),
              let cachedInput = adding(observedTokens.cachedInput, difference.cachedInput),
              let output = adding(observedTokens.output, difference.output),
              let reasoningOutput = adding(
                  observedTokens.reasoningOutput, difference.reasoningOutput
              ),
              let total = adding(observedTokens.total, difference.total),
              let cacheWriteInput = adding(
                  observedTokens.cacheWriteInput, difference.cacheWriteInput
              )
        else {
            return false
        }
        observedTokens = TokenBreakdown(
            input: input,
            cachedInput: cachedInput,
            output: output,
            reasoningOutput: reasoningOutput,
            total: total,
            cacheWriteInput: cacheWriteInput
        )
        return true
    }
}
