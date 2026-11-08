import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findProduct: vi.fn(),
  createHighlight: vi.fn(),
  findHighlight: vi.fn(),
  updateHighlight: vi.fn(),
  permanentlyRemoveHighlight: vi.fn(),
  uploadImage: vi.fn(),
  enqueueDeletions: vi.fn(),
  processDeletionQueue: vi.fn(),
}));

vi.mock('../src/repositories/product.repository', () => ({
  productRepository: { findById: mocks.findProduct },
}));
vi.mock('../src/repositories/highlight.repository', () => ({
  highlightRepository: {
    create: mocks.createHighlight,
    findById: mocks.findHighlight,
    update: mocks.updateHighlight,
    permanentlyRemove: mocks.permanentlyRemoveHighlight,
  },
}));
vi.mock('../src/services/cloudinary.service', () => ({
  cloudinaryService: { uploadImage: mocks.uploadImage, publicIdFromUrl: vi.fn() },
}));
vi.mock('../src/services/cloudinaryDeletionQueue.service', () => ({
  enqueueCloudinaryDeletions: mocks.enqueueDeletions,
  processCloudinaryDeletionQueue: mocks.processDeletionQueue,
}));

import { ValidationError } from '../src/errors';
import { highlightService } from '../src/services/highlight.service';

const productId = '00000000-0000-4000-8000-000000000001';
const product = {
  id: productId,
  name: 'Portátil',
  status: 'active',
  mainImage: { url: 'https://cdn.example.com/product.jpg' },
};

describe('product-backed highlights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findProduct.mockResolvedValue(product);
    mocks.createHighlight.mockResolvedValue({ id: 'highlight-id', product: { id: productId } });
  });

  it('creates a linked highlight without an uploaded image', async () => {
    await highlightService.create({
      placement: 'hero',
      title: 'Portátil em destaque',
      productId,
      displayOrder: 0,
      isActive: true,
      theme: 'dark',
    });

    expect(mocks.findProduct).toHaveBeenCalledWith(productId);
    expect(mocks.uploadImage).not.toHaveBeenCalled();
    expect(mocks.createHighlight).toHaveBeenCalledWith(
      expect.objectContaining({ productId, imageUrl: null, imagePublicId: null })
    );
  });

  it('rejects products without an image or products that are inactive', async () => {
    mocks.findProduct.mockResolvedValueOnce({ ...product, mainImage: null });
    await expect(
      highlightService.create({
        placement: 'hero',
        title: 'Sem imagem',
        productId,
        displayOrder: 0,
        isActive: true,
        theme: 'dark',
      })
    ).rejects.toBeInstanceOf(ValidationError);

    mocks.findProduct.mockResolvedValueOnce({ ...product, status: 'inactive' });
    await expect(
      highlightService.create({
        placement: 'hero',
        title: 'Produto inactivo',
        productId,
        displayOrder: 0,
        isActive: true,
        theme: 'dark',
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('keeps requiring an uploaded image for editorial highlights without a product', async () => {
    await expect(
      highlightService.create({
        placement: 'hero',
        title: 'Destaque editorial',
        displayOrder: 0,
        isActive: true,
        theme: 'dark',
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('permanently removes a highlight and processes queued editorial image deletion', async () => {
    mocks.permanentlyRemoveHighlight.mockResolvedValue(true);

    await highlightService.permanentlyRemove('highlight-id');

    expect(mocks.permanentlyRemoveHighlight).toHaveBeenCalledWith('highlight-id');
    expect(mocks.processDeletionQueue).toHaveBeenCalledOnce();
  });

  it('returns not found when permanently removing a missing highlight', async () => {
    mocks.permanentlyRemoveHighlight.mockResolvedValue(false);

    await expect(highlightService.permanentlyRemove('missing-id')).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mocks.processDeletionQueue).not.toHaveBeenCalled();
  });
});
