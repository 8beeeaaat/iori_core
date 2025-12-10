/**
 * @ioris/core schemas
 */

export {
  type ValidationResult,
  type ValidationError,
  type Success,
  type Failure,
  success,
  failure,
  isSuccess,
  isFailure,
} from "./result";

export {
  wordTimelineSchema,
  wordTimelinesSchema,
  parseWordTimeline,
  parseWordTimelines,
  type WordTimelineInput,
  type WordTimelineOutput,
  type WordTimelinesInput,
  type WordTimelinesOutput,
} from "./timeline.schema";
