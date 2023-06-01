import excel from 'excel4node';
import moment from 'moment';

import { BusinessBrand } from '../../models/main/business-brand.model';
import { Campaign } from '../../models/main/campaign.model';
import { PaidForContent } from '../../models/main/paid-for-content.model';
import { Product } from '../../models/main/product.model';
import {
  addCurrencySign,
  INSTAGRAM,
  INSTAGRAM_BASE_URL,
  TIKTOK,
  TIKTOK_BASE_URL
} from '../../utils';
import { InstagramService } from '../instagram';
import { TiktokService } from '../tiktok';
import {
  AUDIENCE,
  AUDIENCE_COLUMNS,
  AUDIENCE_COLUMNS_STR,
  AUDIENCE_REACHABILITY_RANGES,
  CLIENT,
  CONTROL,
  FEMALE,
  MALE,
  METRICS,
  METRICS_COLUMNS,
  METRICS_COLUMNS_OPT,
  NOTABLE_FOLLOWERS,
  NOTABLE_FOLLOWERS_COLUMNS,
  PROFILE,
  PROFILE_COLUMNS,
  REQUEST,
  REQUEST_COLUMNS,
  REQUEST_COLUMNS_OPT,
  TOP_BRANDS,
  TOP_SOUNDS,
  TRENDS,
  TRENDS_COLUMNS
} from './analytics.const';
import AnalyticsHelper from './analytics.helper';

class AnalyticsCSV {
  /**
   * Returns instance factory
   * @param {type} INSTAGRAM, TIKTOK
   * @param {language} en, es
   */
  constructor(type = INSTAGRAM, language, originator = CLIENT) {
    this.instagramData = '';
    this.tiktokData = '';
    this.partnershipContent = '';
    this.type = type;
    this.language = language;
    this.currencySymbol = '$';
    this.currencyCode = 'USD';
    this.fullName = 'NA';
    this.userName = 'NA';
    this.originator = originator.toLowerCase();

    // initiate workbook;
    this.workbook = new excel.Workbook();
    this.headerStyle = this.workbook.createStyle({
      font: {
        bold: true,
        color: 'black',
        fontFamily: 'Montserrat'
      }
    });
    this.columnStyle = { alignment: { vertical: 'center' } };
  }

  /**
   * Fetch data against instagram and tiktok;
   * @param {*} userId
   * @param {*} partnershipContentId
   */
  async analyticsRepository(userId, partnershipContentId) {
    try {
      if (this.type === INSTAGRAM) {
        this.instagramData = await InstagramService.getAnalytics({
          userId
        });

        if (!this.instagramData) {
          return null;
        }

        if (this.instagramData.users) {
          if (
            this.instagramData.users.country &&
            this.instagramData.users.country.dataValues.currencySymbol
          ) {
            this.currencySymbol = this.instagramData.users.country.dataValues.currencySymbol;
          }

          if (
            this.instagramData.users.country &&
            this.instagramData.users.country.dataValues.currencyCode
          ) {
            this.currencyCode = this.instagramData.users.country.dataValues.currencyCode;
          }
        }
      } else {
        this.tiktokData = await TiktokService.getAnalytics({
          userId
        });

        if (!this.tiktokData) {
          return null;
        }

        if (this.tiktokData.users) {
          if (
            this.tiktokData.users.country &&
            this.tiktokData.users.country.dataValues.currencySymbol
          ) {
            this.currencySymbol = this.tiktokData.users.country.dataValues.currencySymbol;
          }
          if (
            this.tiktokData.users.country &&
            this.tiktokData.users.country.dataValues.currencyCode
          ) {
            this.currencyCode = this.tiktokData.users.country.dataValues.currencyCode;
          }
        }
      }

      if (partnershipContentId !== null) {
        this.partnershipContent = await PaidForContent.findOne({
          model: PaidForContent,
          where: {
            id: partnershipContentId
          },
          include: [
            {
              model: Campaign,
              as: 'campaign',
              attributes: ['title'],
              include: [
                {
                  model: BusinessBrand,
                  as: 'brand',
                  attributes: ['title']
                }
              ]
            },
            {
              model: Product,
              as: 'product',
              attributes: ['name']
            }
          ]
        });
      }

      this.userName = this.getUsernameAndFullName().userName;
      this.fullName = this.getUsernameAndFullName().fullName;

      return true;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Load sheets;
   * @params
   *  - sheets object containing sheets to be exploted
   */
  loadSheets(sheets) {
    try {
      const { request, profile, metrics, audience, trends } = sheets;

      if (request) {
        this.generateRequestSheet();
      }

      if (profile) {
        this.generateProfileSheet();
      }

      if (metrics) {
        this.generateMetricsSheet();
      }

      if (audience) {
        this.generateAudienceSheet();
      }

      if (trends) {
        this.generateTrendsSheet();
      }

      // if (notableFollowers) {
      //   this.generateNotableFollowers();
      // }
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Generate Trends sheet
   */
  generateTrendsSheet() {
    try {
      const trendsSheet = this.workbook.addWorksheet(TRENDS[this.language]);

      TRENDS_COLUMNS[this.language]
        .filter((trends) => {
          if (this.type === TIKTOK) {
            return trends !== TOP_BRANDS[this.language];
          } else {
            return trends !== TOP_SOUNDS[this.language];
          }
        })
        .forEach((field, index) => {
          trendsSheet
            .cell(1, index + 1)
            .string(field)
            .style(this.headerStyle);
        });

      const trendsSheetData = this.topTrends();

      if (trendsSheetData && trendsSheetData.length) {
        trendsSheetData.forEach((content, currIndex) => {
          Object.keys(content).forEach((trend, colIndex) => {

            if (trend && content[trend] && content[trend].length) {
              if (typeof content[trend] === 'string') {
                const row = currIndex + 2;
                const column = colIndex + 1;

                trendsSheet
                  .cell(row, column)
                  .string(content[trend] ? String(content[trend]) : 'NA')
                  .style({ alignment: { vertical: 'center' } });
              } else {
                Object.values(content[trend]).forEach((tag, rowIndex) => {
                  const row = rowIndex + 2;
                  const column = colIndex + 1;

                  trendsSheet
                    .cell(row, column)
                    .string(tag ? String(tag) : 'NA')
                    .style({ alignment: { vertical: 'center' } });
                });
              }
      
            }
          });
        });
      }
    } catch (error) {
      throw new Error(error);
    }
  }