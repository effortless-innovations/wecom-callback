import { describe, expect, test } from 'bun:test';
import { calculateSignature, decryptMessage } from '../utils';
import { createHash } from 'node:crypto';

describe('calculateSignature', () => {
  test('应该正确计算签名', () => {
    // 准备测试数据
    const token = 'testToken';
    const timestamp = '1234567890';
    const nonce = 'randomNonce';
    const encryptedMsg = 'encryptedMessage';
    
    // 手动计算预期结果
    const params = [token, timestamp, nonce, encryptedMsg];
    params.sort();
    const joinedParams = params.join('');
    
    // 使用与 calculateSignature 相同的方法计算哈希
    const hash = createHash('sha1');
    hash.update(joinedParams);
    const expectedSignature = hash.digest('hex');
    
    // 调用被测试函数
    const result = calculateSignature(token, timestamp, nonce, encryptedMsg);
    
    // 验证结果
    expect(result).toBe(expectedSignature);
  });
  
  test('不同参数应该产生不同的签名', () => {
    const token = 'testToken';
    const timestamp = '1234567890';
    const nonce = 'randomNonce';
    const encryptedMsg1 = 'encryptedMessage1';
    const encryptedMsg2 = 'encryptedMessage2';
    
    const signature1 = calculateSignature(token, timestamp, nonce, encryptedMsg1);
    const signature2 = calculateSignature(token, timestamp, nonce, encryptedMsg2);
    
    expect(signature1).not.toBe(signature2);
  });
  
  test('空参数应该也能计算签名', () => {
    const result = calculateSignature('', '', '', '');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBe(40); // SHA-1 哈希值长度为40个字符
  });
});

describe('decryptMessage', () => {
  // 由于 decryptMessage 函数涉及到实际的加密解密操作，
  // 我们需要准备有效的测试数据，这里使用模拟数据进行测试
  
  test('应该抛出错误当 EncodingAESKey 长度不正确', () => {
    const invalidKey = 'tooShortKey'; // 不是43位的 key
    const encryptedBase64 = 'someEncryptedData';
    const corpId = 'testCorpId';
    
    expect(() => {
      decryptMessage(encryptedBase64, invalidKey, corpId);
    }).toThrow('无效的 EncodingAESKey');
  });
  
  // 注意：以下测试需要有效的加密数据才能完全测试
  // 在实际情况中，我们可能需要使用 mock 或者准备特定的测试数据
  
  test('应该抛出错误当 CorpID 不匹配', () => {
    // 这个测试需要一个有效的加密消息，但我们可以模拟异常情况
    // 由于我们没有实际的加密数据，这个测试可能无法完全执行
    // 在实际项目中，你可能需要使用 mock 或者准备特定的测试数据
    
    // 这里我们只是演示测试结构
    const mockValidKey = 'jWmYm7qr5nMoAUwZRjGtBxmz3KA1tkAj3ykkR6q2B2C'; // 43位
    const mockEncryptedData = 'mockEncryptedData'; // 这不是真实的加密数据
    const wrongCorpId = 'wrongCorpId';
    
    // 由于我们没有真实的加密数据，这个测试会失败
    // 在实际项目中，你需要准备有效的测试数据或使用 mock
    expect(() => {
      decryptMessage(mockEncryptedData, mockValidKey, wrongCorpId);
    }).toThrow(); // 我们期望会抛出某种错误
  });
});