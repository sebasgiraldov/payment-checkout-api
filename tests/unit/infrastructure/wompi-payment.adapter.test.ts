import { WompiPaymentAdapter } from '../../../src/infrastructure/payment/wompi-payment.adapter';
import { PaymentRequest } from '../../../src/domain/services/payment-gateway.interface';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WompiPaymentAdapter', () => {
  let adapter: WompiPaymentAdapter;
  let mockAxiosInstance: any;
  
  const config = {
    baseUrl: 'https://sandbox.wompi.co/v1',
    publicKey: 'pub_test_123',
    privateKey: 'prv_test_123',
    integrityKey: 'int_test_123',
  };

  beforeEach(() => {
    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
    };
    
    // Mock axios.create to return our mock instance
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    
    adapter = new WompiPaymentAdapter(config);
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    const paymentRequest: PaymentRequest = {
      amount: 100000,
      currency: 'COP',
      cardNumber: '4242424242424242',
      cardHolder: 'John Doe',
      expiryMonth: '12',
      expiryYear: '2028',
      cvv: '123',
      customerEmail: 'john@example.com',
      reference: 'ref-123',
      idempotencyKey: 'idem-123',
    };

    it('should process approved payment successfully', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: { 
          data: { 
            presigned_acceptance: { acceptance_token: 'accept-123' } 
          } 
        } 
      });
      
      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: { data: { id: 'token-123' } } }) // tokenize
        .mockResolvedValueOnce({ data: { data: { id: 'source-123' } } }) // payment source
        .mockResolvedValueOnce({ 
          data: { 
            data: { 
              id: 'trans-123',
              status: 'APPROVED',
            } 
          } 
        }); // transaction

      const result = await adapter.processPayment(paymentRequest);

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('APPROVED');
      expect(result.value.transactionId).toBe('trans-123');
    });

    it('should handle declined payment', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: { 
          data: { 
            presigned_acceptance: { acceptance_token: 'accept-123' } 
          } 
        } 
      });
      
      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: { data: { id: 'token-123' } } })
        .mockResolvedValueOnce({ data: { data: { id: 'source-123' } } })
        .mockResolvedValueOnce({ 
          data: { 
            data: { 
              id: 'trans-123',
              status: 'DECLINED',
            } 
          } 
        });

      const result = await adapter.processPayment(paymentRequest);

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('DECLINED');
    });

    it('should handle pending payment', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: { 
          data: { 
            presigned_acceptance: { acceptance_token: 'accept-123' } 
          } 
        } 
      });
      
      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: { data: { id: 'token-123' } } })
        .mockResolvedValueOnce({ data: { data: { id: 'source-123' } } })
        .mockResolvedValueOnce({ 
          data: { 
            data: { 
              id: 'trans-123',
              status: 'PENDING',
            } 
          } 
        });

      const result = await adapter.processPayment(paymentRequest);

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('PENDING');
    });

    it('should handle tokenization error', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: { 
          data: { 
            presigned_acceptance: { acceptance_token: 'accept-123' } 
          } 
        } 
      });
      
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Tokenization failed'));

      const result = await adapter.processPayment(paymentRequest);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Tokenization failed');
    });

    it('should handle payment source creation error', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: { 
          data: { 
            presigned_acceptance: { acceptance_token: 'accept-123' } 
          } 
        } 
      });
      
      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: { data: { id: 'token-123' } } })
        .mockRejectedValueOnce(new Error('Source creation failed'));

      const result = await adapter.processPayment(paymentRequest);

      expect(result.isFailure).toBe(true);
    });

    it('should handle transaction creation error', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: { 
          data: { 
            presigned_acceptance: { acceptance_token: 'accept-123' } 
          } 
        } 
      });
      
      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: { data: { id: 'token-123' } } })
        .mockResolvedValueOnce({ data: { data: { id: 'source-123' } } })
        .mockRejectedValueOnce(new Error('Transaction failed'));

      const result = await adapter.processPayment(paymentRequest);

      expect(result.isFailure).toBe(true);
    });

    it('should handle network timeout', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({ code: 'ECONNABORTED' });

      const result = await adapter.processPayment(paymentRequest);

      expect(result.isFailure).toBe(true);
    });

    it('should handle 500 error from gateway', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      });

      const result = await adapter.processPayment(paymentRequest);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status successfully', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 'trans-123',
            status: 'APPROVED',
          },
        },
      });

      const result = await adapter.getPaymentStatus('trans-123');

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('APPROVED');
    });

    it('should handle error when getting status', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not found'));

      const result = await adapter.getPaymentStatus('trans-123');

      expect(result.isFailure).toBe(true);
    });
  });
});
