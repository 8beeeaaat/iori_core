/**
 * @ioris/core schemas
 */

export {
  failure,
  isFailure,
  isSuccess, success, type Failure, type Success, type ValidationError,
  type ValidationResult
} from "./result";

export {
  parseWordTimeline,
  parseWordTimelines, wordTimelineSchema,
  wordTimelinesSchema, type WordTimelineInput,
  type WordTimelineOutput,
  type WordTimelinesInput,
  type WordTimelinesOutput
} from "./timeline.schema";

