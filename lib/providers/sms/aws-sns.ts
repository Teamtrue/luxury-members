/**
 * lib/providers/sms/aws-sns.ts
 *
 * AWS SNS SMS provider — full implementation.
 *
 * Required admin config fields:
 *   aws_access_key_id      — IAM access key with sns:Publish permission
 *   aws_secret_access_key  — IAM secret key
 *   aws_region             — AWS region (default ap-south-1)
 *   sender_id              — Alphanumeric sender ID (where supported, e.g. "PLUTUS")
 *
 * Note: AWS SNS does not support DLT sender IDs natively for India.
 * For full TRAI compliance in India, use MSG91 or Twilio instead.
 * SNS works well for OTPs on international numbers or non-regulated routes.
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import type { SMSProvider, ProviderConfig, SendOTPParams, SendSMSParams, SMSResult } from '../types';
import { ProviderError } from '../types';

export class AWSSNSProvider implements SMSProvider {
  readonly name = 'aws_sns' as const;

  private client:   SNSClient;
  private senderId: string;

  constructor(config: ProviderConfig) {
    const {
      aws_access_key_id,
      aws_secret_access_key,
      aws_region,
      sender_id,
    } = config.config;

    if (!aws_access_key_id || !aws_secret_access_key) {
      throw new ProviderError('aws_sns', null, 'AWS SNS: aws_access_key_id and aws_secret_access_key are required.');
    }

    this.client = new SNSClient({
      region: aws_region || 'ap-south-1',
      credentials: {
        accessKeyId:     aws_access_key_id,
        secretAccessKey: aws_secret_access_key,
      },
    });

    this.senderId = sender_id || 'PLUTUS';
  }

  async sendOTP(params: SendOTPParams): Promise<SMSResult> {
    const message =
      `Your PlutusClub verification code is ${params.otp}. ` +
      `Valid for ${params.expiryMinutes} minute${params.expiryMinutes === 1 ? '' : 's'}. ` +
      `Do not share this with anyone.`;
    return this.publish(params.phone, message);
  }

  async sendTransactional(params: SendSMSParams): Promise<SMSResult> {
    return this.publish(params.phone, params.message);
  }

  private async publish(phone: string, message: string): Promise<SMSResult> {
    const command = new PublishCommand({
      PhoneNumber: phone,
      Message:     message,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType:    'String',
          StringValue: this.senderId,
        },
        'AWS.SNS.SMS.SMSType': {
          DataType:    'String',
          StringValue: 'Transactional',
        },
      },
    });

    try {
      const response = await this.client.send(command);
      return {
        messageId: response.MessageId ?? 'unknown',
        status:    'sent',
      };
    } catch (err) {
      throw new ProviderError('aws_sns', err, `AWS SNS publish failed: ${(err as Error).message}`);
    }
  }
}
