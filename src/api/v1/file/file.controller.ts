import { FileService } from '../../../services/file/file.service';
import { Helpers } from '../../../helpers/utitlity.helpers';
import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { AppGuard } from 'src/services/auth/app.guard';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseGuards(AppGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file): Promise<ApiResponse> {
    console.log('file', file);
    const response = await this.fileService.uploadFile(file);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Post('uploads')
  @UseInterceptors(FilesInterceptor('files[]'))
  async uploadMultiple(@UploadedFiles() files): Promise<ApiResponse> {
    const resultSet = [];
    let isSuccessful = true;

    for (let i = 0; i < files.length; i++) {
      const response = await this.fileService.uploadFile(files[i]);
      if (!response.success) isSuccessful = false;
      resultSet.push(response.data);
    }

    if (isSuccessful) {
      return Helpers.success(resultSet);
    }

    return Helpers.failedHttpResponse(
      'Unable to upload files',
      HttpStatus.BAD_REQUEST,
    );
  }
}
