/**
 * lib/providers/email/aws-ses.ts
 *
 * AWS SES v2 email provider — full implementation.
 *
 * Required admin config fields:
 *   aws_access_key_id      — IAM access key with ses:SendEmail permission
 *   aws_secret_access_key  — IAM secret key
 *   aws_region             — AWS region (e.g. ap-south-1)
 *   from_email             — Verified SES sender address
 *   from_name              — Display name (e.g. PlutusClub)
 *
 * Prerequisites:
 *   - Verify your sending domain or email address in SES console.
 *   - Move account out of SES sandbox for production sends.
 */

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { EmailProvider, ProviderConfig, SendEmailParams, EmailResult } from '../types';
import { ProviderError } from '../types';

export class AWSSESProvider implements EmailProvider {
  readonly name = 'aws_ses' as const;

  private client:    SESv2Client;
  private fromEmail: string;
  private fromName:  string;

  constructor(config: ProviderConfig) {
    const {
      aws_access_key_id,
      aws_secret_access_key,
      aws_region,
      from_email,
      from_name,
    } = config.config;

    if (!aws_access_key_id || !aws_secret_access_key) {
      throw new ProviderError('aws_ses', null, 'AWS SES: aws_access_key_id and aws_secret_access_key are required.');
    }
    if (!from_email) {
      throw new ProviderError('aws_ses', null, 'AWS SES: from_email is required.');
    }

    this.client = new SESv2Client({
      region: aws_region || 'ap-south-1',
      credentials: {
        accessKeyId:     aws_access_key_id,
        secretAccessKey: aws_secret_access_key,
      },
    });

    this.fromEmail = from_email;
    this.fromName  = from_name || 'PlutusClub';
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    const toAddresses = Array.isArray(params.to) ? params.to : [params.to];
    const fromAddress = `${this.fromName} <${this.fromEmail}>`;

    const command = new SendEmailCommand({
      FromEmailAddress: params.from ?? fromAddress,
      ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
      Destination: {
        ToAddresses: toAddresses,
      },
      Content: {
        Simple: {
          Subject: { Data: params.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: params.html, Charset: 'UTF-8' },
            ...(params.text && {
              Text: { Data: params.text, Charset: 'UTF-8' },
            }),
          },
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
      throw new ProviderError('aws_ses', err, `AWS SES sendEmail failed: ${(err as Error).message}`);
    }
  }
}
