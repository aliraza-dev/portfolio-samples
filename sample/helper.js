import moment from 'moment';

import { AWSService } from '../../services';
import { createUrl, getCdnFromLocation } from '../../utils';
import AnalyticsCSV from './analytics.csv';

class AnalyticsHelper {
  /**
   * Uploaded a file to s3 and return url
   * @param {*} workbook
   * @param {*} sheetname
   * @returns
   *  s3 url for workbook
   */
  async uploadToS3AndReturnUrl(workbook, sheetName = null) {
    try {
      // setting file name
      let fileName = '';

      if (sheetName) {
        fileName = sheetName;
      } else {
        fileName = `analytics_${moment().format('DD_MM_YYYY_H_s')}_${
          Math.floor(Math.random() * 1000) + 1
        }.xlsx`;
      }

      // upload buffer to s3
      let location = '';
      await workbook.writeToBuffer().then(async (fileBuffer) => {
        const url = createUrl(`${fileName}`, 'analytics', 'grin', '');

        const { Location } = await AWSService.saveToS3(
          fileBuffer,
          `${url}`,
          'application/vnd.ms-excel'
        );
        location = getCdnFromLocation({ Location });
      });

      return location;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Returns instance of AnalyticsCSV to be used elsewhere
   * @param {userId} Logged in User ID
   * @param {partnershipContentId}
   * @param {type} INSTAGRAM, TIKTOK
   * @param {language} en, es
   * @param {originator} control/client
   * @returns access to analytics csv factory
   */
  async loadCSVFactory(userId, partnershipContentId, type, language, originator) {
    try {
      const analyticsFactory = new AnalyticsCSV(type, language, originator);
      const factoryLoaded = await analyticsFactory.analyticsRepository(
        userId,
        partnershipContentId
      );

      if (!factoryLoaded) return null;

      return analyticsFactory;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Validates is the number isn't NaN
   * @param {number} number
   * @returns
   */
  validateNumber(number) {
    if (isNaN(number) || !number) return 0;
    if (typeof number === 'number') return number.toFixed(2);
    return number;
  }

  /**
   * Adds Sign
   * @params
   *  - number
   *  - sign e.g. $, %
   */
  addSignToProp(prop, sign) {
    if (!prop) return prop;
    if (!sign) return prop;
    return `${prop}${sign}`;
  }

  /**
   * Check if empty, adds NA
   */
  isEmpty(attr) {
    if (!attr) return 'NA';
    return attr;
  }
}

export default new AnalyticsHelper();
