/** Matches backend `open_webui.constants.ERROR_MESSAGES.NOT_FOUND`. */
export const FEEDBACK_NOT_FOUND = "We could not find what you're looking for :/";

export type RatingFeedback = { id: string };

export type PersistRatingFeedbackResult<T extends RatingFeedback> = {
	feedback: T | null | undefined;
	feedbackId: string | undefined;
	error?: unknown;
};

/**
 * Update an existing reply rating, or create one when the message has no ID
 * or the stored ID was deleted from Evaluations (stale not-found).
 */
export async function persistRatingFeedback<T extends RatingFeedback>(options: {
	existingId?: string | null;
	updateById: (id: string) => Promise<T | null | undefined>;
	create: () => Promise<T | null | undefined>;
}): Promise<PersistRatingFeedbackResult<T>> {
	let feedback: T | null | undefined = null;
	let feedbackId = options.existingId || undefined;

	if (options.existingId) {
		try {
			feedback = await options.updateById(options.existingId);
		} catch (error) {
			if (error !== FEEDBACK_NOT_FOUND) {
				return { feedback: null, feedbackId, error };
			}
			feedbackId = undefined;
		}
	}

	if (!feedback && !feedbackId) {
		try {
			feedback = await options.create();
			if (feedback) {
				feedbackId = feedback.id;
			}
		} catch (error) {
			return { feedback: null, feedbackId: undefined, error };
		}
	}

	return { feedback, feedbackId };
}
