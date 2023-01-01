import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { UnitLogDocument, UnitLog } from '../../schemas/unite-logs.schema';
import { Helpers } from 'src/helpers';
import { Messages } from 'src/utils/messages/messages';
import { UnitLogDto } from '../../dtos/unit.dto';

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(UnitLog.name) private unitLog: Model<UnitLogDocument>,
  ) {}

  async saveUnitLog(unitLog: UnitLogDto): Promise<ApiResponse> {
    try {
      const request = {
        ...unitLog,
      } as any;

      const createdUnit = await (await this.unitLog.create(request)).save();
      return Helpers.success(createdUnit);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getUnitLog(address: string): Promise<ApiResponse> {
    try {
      const unitLogs = await this.unitLog
        .find({ $text: { $search: address } })
        .limit(10)
        .sort({ createdAt: -1 })
        .exec();
      if (unitLogs.length) return Helpers.success(unitLogs);
      return Helpers.fail('No transaction found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
