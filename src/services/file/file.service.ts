import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from '../../helpers/utitlity.helpers';

@Injectable()
export class FileService {
  AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
  });

  async uploadFile(file): Promise<ApiResponse> {
    try {
      if (!file) return Helpers.fail('File not found');
      const { originalname } = file;
      const filename = `${Helpers.getCode()}${new Date().getTime()}${Helpers.getExtension(
        originalname,
      )}`;

      console.log('Uploading file', filename);
      return await this.s3_upload(
        file.buffer,
        this.AWS_S3_BUCKET,
        filename,
        file.mimetype,
      );
    } catch (ex) {
      console.log(ex);
      return Helpers.fail('Unable to upload file');
    }
  }

  async uploadBuffer(buffer): Promise<ApiResponse> {
    try {
      if (!buffer) return Helpers.fail('File not found');
      const filename = `qr${Helpers.getCode()}${new Date().getTime()}.png`;

      console.log('Uploading file', filename);
      return await this.s3_upload(
        buffer,
        this.AWS_S3_BUCKET,
        filename,
        'image/png',
      );
    } catch (ex) {
      console.log(ex);
      return Helpers.fail('Unable to upload file');
    }
  }

  async s3_upload(file, bucket, name, mimetype): Promise<ApiResponse> {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'ap-south-1',
      },
    };
    try {
      const s3Response = await this.s3.upload(params).promise();
      const response = {
        url: s3Response.Location,
        fileName: s3Response.Key,
      } as any;
      return Helpers.success(response);
    } catch (e) {
      console.log(e);
      return Helpers.fail('Unable to upload file');
    }
  }
}
