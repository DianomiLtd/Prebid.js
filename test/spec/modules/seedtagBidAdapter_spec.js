import { expect } from 'chai';
import { spec, getTimeoutUrl } from 'modules/seedtagBidAdapter.js';
import * as utils from 'src/utils.js';

const PUBLISHER_ID = '0000-0000-01';
const ADUNIT_ID = '000000';

function getSlotConfigs(mediaTypes, params) {
  return {
    params: params,
    sizes: [
      [300, 250],
      [300, 600],
    ],
    bidId: '30b31c1838de1e',
    bidderRequestId: '22edbae2733bf6',
    auctionId: '1d1a030790a475',
    bidRequestsCount: 1,
    bidder: 'seedtag',
    mediaTypes: mediaTypes,
    src: 'client',
    transactionId: 'd704d006-0d6e-4a09-ad6c-179e7e758096',
    adUnitCode: 'adunit-code',
  };
}

function createVideoSlotConfig(mediaType) {
  return getSlotConfigs(mediaType, {
    publisherId: PUBLISHER_ID,
    adUnitId: ADUNIT_ID,
    placement: 'video',
  });
}

describe('Seedtag Adapter', function () {
  describe('isBidRequestValid method', function () {
    describe('returns true', function () {
      describe('when banner slot config has all mandatory params', () => {
        describe('and placement has the correct value', function () {
          const createBannerSlotConfig = (placement) => {
            return getSlotConfigs(
              { banner: {} },
              {
                publisherId: PUBLISHER_ID,
                adUnitId: ADUNIT_ID,
                placement,
              }
            );
          };
          const placements = [
            'banner',
            'video',
            'inImage',
            'inScreen',
            'inArticle',
          ];
          placements.forEach((placement) => {
            it('should be ' + placement, function () {
              const isBidRequestValid = spec.isBidRequestValid(
                createBannerSlotConfig(placement)
              );
              expect(isBidRequestValid).to.equal(true);
            });
          });
        });
      });
      describe('when video slot has all mandatory params', function () {
        it('should return true, when video context is instream', function () {
          const slotConfig = getSlotConfigs(
            {
              video: {
                context: 'instream',
                playerSize: [[600, 200]],
              },
            },
            {
              publisherId: PUBLISHER_ID,
              adUnitId: ADUNIT_ID,
              placement: 'video',
            }
          );
          const isBidRequestValid = spec.isBidRequestValid(slotConfig);
          expect(isBidRequestValid).to.equal(true);
        });

        it('should return true, when video context is outstream', function () {
          const slotConfig = getSlotConfigs(
            {
              video: {
                context: 'outstream',
                playerSize: [[600, 200]],
              },
            },
            {
              publisherId: PUBLISHER_ID,
              adUnitId: ADUNIT_ID,
              placement: 'video',
            }
          );
          const isBidRequestValid = spec.isBidRequestValid(slotConfig);
          expect(isBidRequestValid).to.equal(true);
        });
      });
    });
    describe('returns false', function () {
      describe('when params are not correct', function () {
        function createSlotConfig(params) {
          return getSlotConfigs({ banner: {} }, params);
        }
        it('does not have the PublisherToken.', function () {
          const isBidRequestValid = spec.isBidRequestValid(
            createSlotConfig({
              adUnitId: ADUNIT_ID,
              placement: 'banner',
            })
          );
          expect(isBidRequestValid).to.equal(false);
        });
        it('does not have the AdUnitId.', function () {
          const isBidRequestValid = spec.isBidRequestValid(
            createSlotConfig({
              publisherId: PUBLISHER_ID,
              placement: 'banner',
            })
          );
          expect(isBidRequestValid).to.equal(false);
        });
        it('does not have the placement.', function () {
          const isBidRequestValid = spec.isBidRequestValid(
            createSlotConfig({
              publisherId: PUBLISHER_ID,
              adUnitId: ADUNIT_ID,
            })
          );
          expect(isBidRequestValid).to.equal(false);
        });
        it('does not have a the correct placement.', function () {
          const isBidRequestValid = spec.isBidRequestValid(
            createSlotConfig({
              publisherId: PUBLISHER_ID,
              adUnitId: ADUNIT_ID,
              placement: 'another_thing',
            })
          );
          expect(isBidRequestValid).to.equal(false);
        });
      });
      describe('when video mediaType object is not correct', function () {
        function createVideoSlotconfig(mediaType) {
          return getSlotConfigs(mediaType, {
            publisherId: PUBLISHER_ID,
            adUnitId: ADUNIT_ID,
            placement: 'video',
          });
        }
        it('is a void object', function () {
          const isBidRequestValid = spec.isBidRequestValid(
            createVideoSlotConfig({ video: {} })
          );
          expect(isBidRequestValid).to.equal(false);
        });
        it('does not have playerSize.', function () {
          const isBidRequestValid = spec.isBidRequestValid(
            createVideoSlotConfig({ video: { context: 'instream' } })
          );
          expect(isBidRequestValid).to.equal(false);
        });
        it('is outstream ', function () {
          const isBidRequestValid = spec.isBidRequestValid(
            createVideoSlotConfig({
              video: {
                context: 'outstream',
                playerSize: [[600, 200]],
              },
            })
          );
          expect(isBidRequestValid).to.equal(true);
        });
        describe('order does not matter', function () {
          it('when video is not the first slot', function () {
            const isBidRequestValid = spec.isBidRequestValid(
              createVideoSlotConfig({ banner: {}, video: {} })
            );
            expect(isBidRequestValid).to.equal(false);
          });
          it('when video is the first slot', function () {
            const isBidRequestValid = spec.isBidRequestValid(
              createVideoSlotConfig({ video: {}, banner: {} })
            );
            expect(isBidRequestValid).to.equal(false);
          });
        });
      });
    });
  });

  describe('buildRequests method', function () {
    const bidderRequest = {
      refererInfo: { page: 'referer' },
      timeout: 1000,
    };
    const mandatoryParams = {
      publisherId: PUBLISHER_ID,
      adUnitId: ADUNIT_ID,
      placement: 'banner',
    };
    const inStreamParams = Object.assign({}, mandatoryParams, {
      video: {
        mimes: 'mp4',
      },
    });
    const validBidRequests = [
      getSlotConfigs({ banner: {} }, mandatoryParams),
      getSlotConfigs(
        { video: { context: 'instream', playerSize: [[300, 200]] } },
        inStreamParams
      ),
    ];
    it('Url params should be correct ', function () {
      const request = spec.buildRequests(validBidRequests, bidderRequest);
      expect(request.method).to.equal('POST');
      expect(request.url).to.equal('https://s.seedtag.com/c/hb/bid');
    });

    it('Common data request should be correct', function () {
      const now = Date.now();
      const request = spec.buildRequests(validBidRequests, bidderRequest);
      const data = JSON.parse(request.data);
      expect(data.url).to.equal('referer');
      expect(data.publisherToken).to.equal('0000-0000-01');
      expect(typeof data.version).to.equal('string');
      expect(
        ['fixed', 'mobile', 'unknown'].indexOf(data.connectionType)
      ).to.be.above(-1);
      expect(data.auctionStart).to.be.greaterThanOrEqual(now);
      expect(data.ttfb).to.be.greaterThanOrEqual(0);

      expect(data.bidRequests[0].adUnitCode).to.equal('adunit-code');
    });

    describe('adPosition param', function () {
      it('should sended when publisher set adPosition param', function () {
        const params = Object.assign({}, mandatoryParams, {
          adPosition: 1,
        });
        const validBidRequests = [getSlotConfigs({ banner: {} }, params)];
        const request = spec.buildRequests(validBidRequests, bidderRequest);
        const data = JSON.parse(request.data);
        expect(data.bidRequests[0].adPosition).to.equal(1);
      });
      it('should not sended when publisher has not set adPosition param', function () {
        const validBidRequests = [
          getSlotConfigs({ banner: {} }, mandatoryParams),
        ];
        const request = spec.buildRequests(validBidRequests, bidderRequest);
        const data = JSON.parse(request.data);
        expect(data.bidRequests[0].adPosition).to.equal(undefined);
      });
    });

    describe('GDPR params', function () {
      describe('when there arent consent management platform', function () {
        it('cmp should be false', function () {
          const request = spec.buildRequests(validBidRequests, bidderRequest);
          const data = JSON.parse(request.data);
          expect(data.cmp).to.equal(false);
        });
      });
      describe('when there are consent management platform', function () {
        it('cmps should be true and ga should not sended, when gdprApplies is undefined', function () {
          bidderRequest['gdprConsent'] = {
            gdprApplies: undefined,
            consentString: 'consentString',
          };
          const request = spec.buildRequests(validBidRequests, bidderRequest);
          const data = JSON.parse(request.data);
          expect(data.cmp).to.equal(true);
          expect(Object.keys(data).indexOf('data')).to.equal(-1);
          expect(data.cd).to.equal('consentString');
        });
        it('cmps should be true and all gdpr parameters should be sended, when there are gdprApplies', function () {
          bidderRequest['gdprConsent'] = {
            gdprApplies: true,
            consentString: 'consentString',
          };
          const request = spec.buildRequests(validBidRequests, bidderRequest);
          const data = JSON.parse(request.data);
          expect(data.cmp).to.equal(true);
          expect(data.ga).to.equal(true);
          expect(data.cd).to.equal('consentString');
        });
        it('should expose gvlid', function () {
          expect(spec.gvlid).to.equal(157);
        });
        it('should handle uspConsent', function () {
          const uspConsent = '1---';

          bidderRequest['uspConsent'] = uspConsent;

          const request = spec.buildRequests(validBidRequests, bidderRequest);
          const payload = JSON.parse(request.data);

          expect(payload.uspConsent).to.exist;
          expect(payload.uspConsent).to.equal(uspConsent);
        });

        it("shouldn't send uspConsent when not available", function () {
          const uspConsent = undefined;

          bidderRequest['uspConsent'] = uspConsent;

          const request = spec.buildRequests(
            validBidRequests,
            bidderRequest
          );
          const payload = JSON.parse(request.data);

          expect(payload.uspConsent).to.not.exist;
        });
      });
    });

    describe('BidRequests params', function () {
      const request = spec.buildRequests(validBidRequests, bidderRequest);
      const data = JSON.parse(request.data);
      const bidRequests = data.bidRequests;
      it('should request a Banner', function () {
        const bannerBid = bidRequests[0];
        expect(bannerBid.id).to.equal('30b31c1838de1e');
        expect(bannerBid.transactionId).to.equal(
          'd704d006-0d6e-4a09-ad6c-179e7e758096'
        );
        expect(bannerBid.supplyTypes[0]).to.equal('display');
        expect(bannerBid.adUnitId).to.equal('000000');
        expect(bannerBid.sizes[0][0]).to.equal(300);
        expect(bannerBid.sizes[0][1]).to.equal(250);
        expect(bannerBid.sizes[1][0]).to.equal(300);
        expect(bannerBid.sizes[1][1]).to.equal(600);
        expect(bannerBid.requestCount).to.equal(1);
      });
      it('should request an InStream Video', function () {
        const videoBid = bidRequests[1];
        expect(videoBid.id).to.equal('30b31c1838de1e');
        expect(videoBid.transactionId).to.equal(
          'd704d006-0d6e-4a09-ad6c-179e7e758096'
        );
        expect(videoBid.supplyTypes[0]).to.equal('video');
        expect(videoBid.adUnitId).to.equal('000000');
        expect(videoBid.videoParams.mimes).to.equal('mp4');
        expect(videoBid.videoParams.w).to.equal(300);
        expect(videoBid.videoParams.h).to.equal(200);
        expect(videoBid.sizes[0][0]).to.equal(300);
        expect(videoBid.sizes[0][1]).to.equal(250);
        expect(videoBid.sizes[1][0]).to.equal(300);
        expect(videoBid.sizes[1][1]).to.equal(600);
        expect(videoBid.requestCount).to.equal(1);
      });
    });

    describe('schain param', function () {
      it('should add schain to payload when exposed on validBidRequest', function () {
        // https://github.com/prebid/Prebid.js/blob/master/modules/schain.md#sample-code-for-passing-the-schain-object
        const schain = {
          validation: 'strict',
          config: {
            ver: '1.0',
            complete: 1,
            nodes: [
              {
                asi: 'indirectseller.com',
                sid: '00001',
                hp: 1,
              },

              {
                asi: 'indirectseller-2.com',
                sid: '00002',
                hp: 1,
              },
            ],
          },
        };

        // duplicate
        const bidRequests = JSON.parse(JSON.stringify(validBidRequests))
        bidRequests[0].schain = schain;

        const request = spec.buildRequests(bidRequests, bidderRequest);

        const payload = JSON.parse(request.data);

        expect(payload.schain).to.exist;
        expect(payload.schain).to.deep.equal(schain);
      });

      it("shouldn't add schain to payload when not exposed", function () {
        const request = spec.buildRequests(validBidRequests, bidderRequest);

        const payload = JSON.parse(request.data);

        expect(payload.schain).to.not.exist;
      });
    });
  });

  describe('interpret response method', function () {
    it('should return a void array, when the server response are not correct.', function () {
      const request = { data: JSON.stringify({}) };
      const serverResponse = {
        body: {},
      };
      const bids = spec.interpretResponse(serverResponse, request);
      expect(typeof bids).to.equal('object');
      expect(bids.length).to.equal(0);
    });
    it('should return a void array, when the server response have no bids.', function () {
      const request = { data: JSON.stringify({}) };
      const serverResponse = { body: { bids: [] } };
      const bids = spec.interpretResponse(serverResponse, request);
      expect(typeof bids).to.equal('object');
      expect(bids.length).to.equal(0);
    });
    describe('when the server response return a bid', function () {
      describe('the bid is a banner', function () {
        it('should return a banner bid', function () {
          const request = { data: JSON.stringify({}) };
          const serverResponse = {
            body: {
              bids: [
                {
                  bidId: '2159a54dc2566f',
                  price: 0.5,
                  currency: 'USD',
                  content: 'content',
                  width: 728,
                  height: 90,
                  mediaType: 'display',
                  ttl: 360,
                  nurl: 'testurl.com/nurl',
                  adomain: ['advertiserdomain.com'],
                },
              ],
              cookieSync: { url: '' },
            },
          };
          const bids = spec.interpretResponse(serverResponse, request);
          expect(bids.length).to.equal(1);
          expect(bids[0].requestId).to.equal('2159a54dc2566f');
          expect(bids[0].cpm).to.equal(0.5);
          expect(bids[0].width).to.equal(728);
          expect(bids[0].height).to.equal(90);
          expect(bids[0].currency).to.equal('USD');
          expect(bids[0].netRevenue).to.equal(true);
          expect(bids[0].ad).to.equal('content');
          expect(bids[0].nurl).to.equal('testurl.com/nurl');
          expect(bids[0].meta.advertiserDomains).to.deep.equal([
            'advertiserdomain.com',
          ]);
        });
      });
      describe('the bid is a video', function () {
        it('should return a instream bid', function () {
          const request = { data: JSON.stringify({}) };
          const serverResponse = {
            body: {
              bids: [
                {
                  bidId: '2159a54dc2566f',
                  price: 0.5,
                  currency: 'USD',
                  content: 'content',
                  width: 728,
                  height: 90,
                  mediaType: 'video',
                  ttl: 360,
                  nurl: undefined,
                },
              ],
              cookieSync: { url: '' },
            },
          };
          const bids = spec.interpretResponse(serverResponse, request);
          expect(bids.length).to.equal(1);
          expect(bids[0].requestId).to.equal('2159a54dc2566f');
          expect(bids[0].cpm).to.equal(0.5);
          expect(bids[0].width).to.equal(728);
          expect(bids[0].height).to.equal(90);
          expect(bids[0].currency).to.equal('USD');
          expect(bids[0].netRevenue).to.equal(true);
          expect(bids[0].vastXml).to.equal('content');
          expect(bids[0].meta.advertiserDomains).to.deep.equal([]);
        });
      });
    });
  });

  describe('user syncs method', function () {
    it('should return empty array, when iframe sync option are disabled.', function () {
      const syncOption = { iframeEnabled: false };
      const serverResponses = [{ body: { cookieSync: 'someUrl' } }];
      const cookieSyncArray = spec.getUserSyncs(syncOption, serverResponses);
      expect(cookieSyncArray.length).to.equal(0);
    });
    it('should return empty array, when the server response are wrong.', function () {
      const syncOption = { iframeEnabled: true };
      const serverResponses = [{ body: {} }];
      const cookieSyncArray = spec.getUserSyncs(syncOption, serverResponses);
      expect(cookieSyncArray.length).to.equal(0);
    });
    it('should return empty array, when the server response are void.', function () {
      const syncOption = { iframeEnabled: true };
      const serverResponses = [{ body: { cookieSync: '' } }];
      const cookieSyncArray = spec.getUserSyncs(syncOption, serverResponses);
      expect(cookieSyncArray.length).to.equal(0);
    });
    it('should return a array with the cookie sync, when the server response with a cookie sync.', function () {
      const syncOption = { iframeEnabled: true };
      const serverResponses = [{ body: { cookieSync: 'someUrl' } }];
      const cookieSyncArray = spec.getUserSyncs(syncOption, serverResponses);
      expect(cookieSyncArray.length).to.equal(1);
      expect(cookieSyncArray[0].type).to.equal('iframe');
      expect(cookieSyncArray[0].url).to.equal('someUrl');
    });
  });

  describe('onTimeout', function () {
    beforeEach(function () {
      sinon.stub(utils, 'triggerPixel');
    });

    afterEach(function () {
      utils.triggerPixel.restore();
    });

    it('should return the correct endpoint', function () {
      const params = { publisherId: '0000', adUnitId: '11111' };
      const timeout = 3000;
      const timeoutData = [{ params: [params], timeout }];
      const timeoutUrl = getTimeoutUrl(timeoutData);
      expect(timeoutUrl).to.equal(
        'https://s.seedtag.com/se/hb/timeout?publisherToken=' +
          params.publisherId +
          '&adUnitId=' +
          params.adUnitId +
          '&timeout=' +
          timeout
      );
    });

    it('should set the timeout pixel', function () {
      const params = { publisherId: '0000', adUnitId: '11111' };
      const timeout = 3000;
      const timeoutData = [{ params: [params], timeout }];
      spec.onTimeout(timeoutData);
      expect(
        utils.triggerPixel.calledWith(
          'https://s.seedtag.com/se/hb/timeout?publisherToken=' +
            params.publisherId +
            '&adUnitId=' +
            params.adUnitId +
            '&timeout=' +
            timeout
        )
      ).to.equal(true);
    });
  });

  describe('onBidWon', function () {
    beforeEach(function () {
      sinon.stub(utils, 'triggerPixel');
    });

    afterEach(function () {
      utils.triggerPixel.restore();
    });

    describe('without nurl', function () {
      const bid = {};

      it('does not create pixel ', function () {
        spec.onBidWon(bid);
        expect(utils.triggerPixel.called).to.equal(false);
      });
    });

    describe('with nurl', function () {
      const nurl = 'http://seedtag_domain/won';
      const bid = { nurl };

      it('creates nurl pixel if bid nurl', function () {
        spec.onBidWon({ nurl });
        expect(utils.triggerPixel.calledWith(nurl)).to.equal(true);
      });
    });
  });
});
