import AnalyticsHelper from './analytics.helper';

class AnalyticsService {
  /**
   * Export analytics in csv;
   * @param (user_id)
   * @param (partnershipContentId)
   * @param (csv req) i.e. sheets, type INSTAGRAM, TIKTOK
   * @param (language) i.e. en, es -- language of the logged in user
   * @returns
   *  CSV downloadable link
   */
  async exportAnalyticsToCSV(userId, partnershipContentId, csvReq, language, originator) {
    try {
      const type = csvReq.type.toUpperCase(),
        sheets = csvReq.sheets;

      const analyticsFormation = await AnalyticsHelper.loadCSVFactory(
        userId,
        partnershipContentId,
        type,
        language,
        originator
      );

      if (!analyticsFormation) {
        throw new Error('User not found, please try again or contact NUMU support');
      }

      // Load Sheets;
      analyticsFormation.loadSheets(sheets);
      const getS3Url = await analyticsFormation.uploadCSVtoS3();

      return getS3Url;
    } catch (error) {
      throw new Error(error);
    }
  }
}

export default new AnalyticsService();
