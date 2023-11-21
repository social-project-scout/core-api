import { S3 } from 'aws-sdk';
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    console.log({ s3: this.s3 });
  }

  async uploadFile({
    file,
    location,
  }: {
    file: Express.Multer.File;
    location: string;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      this.s3.upload(
        {
          Bucket: process.env.BUCKET,
          Key: String(location),
          Body: file.buffer,
          ContentType: file.mimetype,
        },
        (err, data) => {
          if (err) {
            Logger.error(err);
            reject(err.message);
          }

          resolve(data.Location);
        },
      );
    });

    return 'location';
  }

  async removeFile({ location }: { location: string }) {
    return new Promise((resolve, reject) => {
      this.s3.deleteObject(
        {
          Bucket: process.env.BUCKET,
          Key: String(location),
        },
        (err, data) => {
          if (err) {
            Logger.error(err);
            reject(err.message);
          }
          resolve(data);
        },
      );
    });
  }
}
