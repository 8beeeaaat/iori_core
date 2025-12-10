/**
 * @ioris/core schemas
 */

export {
  type Failure,
  failure,
  isFailure,
  isSuccess,
  type Success,
  success,
  type ValidationError,
  type ValidationResult,
} from "./result";

export {
  parseWordTimeline,
  parseWordTimelines,
  type WordTimelineInput,
  type WordTimelineOutput,
  type WordTimelinesInput,
  type WordTimelinesOutput,
  wordTimelineSchema,
  wordTimelinesSchema,
} from "./timeline.schema";
