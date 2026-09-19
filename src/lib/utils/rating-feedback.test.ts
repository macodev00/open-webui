import { describe, expect, it, vi } from 'vitest';
import { FEEDBACK_NOT_FOUND, persistRatingFeedback } from './rating-feedback';

describe('persistRatingFeedback', () => {
	it('creates an entry when the reply was never rated', async () => {
		const updateById = vi.fn();
		const result = await persistRatingFeedback({
			existingId: undefined,
			updateById,
			create: async () => ({ id: 'new-1' })
		});

		expect(updateById).not.toHaveBeenCalled();
		expect(result).toEqual({ feedback: { id: 'new-1' }, feedbackId: 'new-1' });
	});

	it('updates an existing entry and does not create another', async () => {
		const create = vi.fn();
		const result = await persistRatingFeedback({
			existingId: 'old',
			updateById: async (id) => ({ id }),
			create
		});

		expect(create).not.toHaveBeenCalled();
		expect(result).toEqual({ feedback: { id: 'old' }, feedbackId: 'old' });
	});

	it('creates a replacement when the stored entry was deleted', async () => {
		const result = await persistRatingFeedback({
			existingId: 'stale',
			updateById: async () => {
				throw FEEDBACK_NOT_FOUND;
			},
			create: async () => ({ id: 'new-2' })
		});

		expect(result).toEqual({ feedback: { id: 'new-2' }, feedbackId: 'new-2' });
		expect(result.error).toBeUndefined();
	});

	it('clears the stale ID and reports create failure', async () => {
		const result = await persistRatingFeedback({
			existingId: 'stale',
			updateById: async () => {
				throw FEEDBACK_NOT_FOUND;
			},
			create: async () => {
				throw 'create failed';
			}
		});

		expect(result).toEqual({
			feedback: null,
			feedbackId: undefined,
			error: 'create failed'
		});
	});

	it('does not create a duplicate when update fails for another reason', async () => {
		const create = vi.fn();
		const result = await persistRatingFeedback({
			existingId: 'live',
			updateById: async () => {
				throw 'server exploded';
			},
			create
		});

		expect(create).not.toHaveBeenCalled();
		expect(result).toEqual({
			feedback: null,
			feedbackId: 'live',
			error: 'server exploded'
		});
	});
});
