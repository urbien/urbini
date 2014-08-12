//'use strict';
define('views/PaymentPage', [
  'globals',
  'utils',
  'events',
  'views/BasicPageView',
  'views/Header',
  'views/RightMenuButton'
], function(G, U, Events, BasicPageView, Header, MenuButton) {

  var root = "https://blockchain.info/";
  return BasicPageView.extend({
    initialize: function(options) {
      options = options || {};
      _.bindAll(this, 'render', 'checkBalance', 'checkBalance1', 'onerror');
      BasicPageView.prototype.initialize.call(this, options);

      if (options.header) {
        this.headerButtons = ['back', 'menu'];
        this.header = new Header({
          viewId: this.cid,
          parentView: this,
          model: this.model
        });

        this.addChild(this.header);
      }

//      this.makeTemplate('blockchainInfoButtonTemplate', 'template');
      this.makeTemplate('paymentOptionsTemplate', 'template', this.vocModel && this.vocModel.type);
    },

    events: {
      'click .blockchain.stage-begin': 'bitcoin'
    },

//    bitcoin: function(e) {
//      Events.stopEvent(e);
//    },

    bitcoin: function(e) {
      var self = this;
      Events.stopEvent(e);
      if (G.currentUser.guest && !this.isAnonymousDonation) {
        Events.trigger('req-login', {
          online: 'Would you like to login first? If you want to make an anonymous donation, just click outside this dialog.',
          dismissible: true,
          onDismiss: function() {
            self.isAnonymousDonation = true;
          }
        });

        return;
      }

      this.hideAll();
      this.spinner = {
        name: 'blockchainInfo'
      };

      G.showSpinner(this.spinner);
      U.ajax({
        type: "POST",
        url: G.serverName + '/payment/blockchainInfo',
        data: {
          method: 'create'
//            ,
//          address: encodeURIComponent(receivers_address)
//          ,
//          shared: shared
        }
      }).done(function(resp) {
        if (!resp || !resp.input_address) {
          self.onerror(resp ? resp.error : { error: "Failed to generate address for transaction" });
          return;
        }

        self.input_address = resp.input_address;
        self.price_in_btc = resp.price_in_btc;
        self.awaitPayment();
      }).fail(function(xhr, err, opts) {
        debugger;
        self.onerror(err);
      });
    },

    hideAll: function() {
      this.stages.$hide();
      if (this.spinner)
        G.hideSpinner(this.spinner);
    },

    onerror: function(error) {
      debugger;
      this.hideAll();
      this.stageError.$show().$html(this.stageError.$html().replace('[[error]]', error.details));
    },

    awaitPayment: function() {
//      this.qrCode.$empty();
      this.hideAll();

      var self = this;
      try {
        ws = new WebSocket('ws://ws.blockchain.info/inv');
        if (!ws)
          return;

        ws.onmessage = function(e) {
          try {
            var obj = JSON.parse(e.data);
            if (obj.op == 'utx') {
              var tx = obj.x;
              var result = 0;
              for (var i = 0; i < tx.out.length; i++) {
                var output = tx.out[i];

                if (output.addr == self.input_address) {
                  result += parseInt(output.value);
                }
              }
            }

            self.onpaid(result/1e8);
            ws.close();
          } catch(e) {
            console.log(e);
            console.log(e.data);
          }
        };

        ws.onopen = function() {
          ws.send('{"op":"addr_sub", "addr":"'+ self.input_address +'"}');
        };
      } catch (e) {
        console.log(e);
      }

      var html = this.stageReady.$html().replace('[[address]]', this.input_address);
      if (this.price_in_btc)
        html = html.replace('[[price_in_btc]]', this.price_in_btc + ' BTC');

      this.stageReady.$show().$html(html);
      this.stageReady.$('.qr-code').$html('<img style="margin:5px" src="'+root+'qr?data='+this.input_address+'&size=125">').$show();
      this.off('click .blockchain.stage-begin');

      ///Check for incoming payment
      setTimeout(this.checkBalance1, 5000);
    },

    onpaid: function(amount) {
      this.hideAll();
      this.stagePaid.$show().$html(this.stagePaid.$html().replace('[[value]]', amount));
    },

    checkBalance1: function() {
      var self = this;

      U.ajax({
        type: 'GET',
        url: G.serverName + '/payment/blockchainInfo?' + _.param({
          test: true,
          method: 'checkreceived',
          input_address: this.input_address
        })
      }).done(function(resp) {
        var value = parseInt(resp);
        if (value > 0) {
          self.onpaid(value / 1e8);
          return;
        } else {
          setTimeout(self.checkBalance1, 5000);
        }
      });
    },

    checkBalance: function() {
      // jsonp this
      var url = root + 'q/getreceivedbyaddress/' + this.input_address + "?cors=true";
//      return U.ajax({
//        url: url
//      }).done(function(response) {
//        debugger;
//        if (!response)
//          return;
//
//        var value = parseInt(response);
//        if (value > 0) {
//          onpaid(value / 1e8);
//        } else {
//          setTimeout(checkBalance, 5000);
//        }
//      }).fail(function() {
//        debugger;
//      });

      var self = this,
          req = new XMLHttpRequest();

      if ('withCredentials' in req) {
        req.open('GET', url, false);
        req.onreadystatechange = function() {
          if (req.readyState === 4) {
            if (req.status >= 200 && req.status < 400) {
              var value = parseInt(req.response);
              if (value > 0) {
                self.onpaid(value / 1e8);
                return;
              } else {
                setTimeout(self.checkBalance, 5000);
              }
            } else {
              debugger;
            }
          }
        };

        req.send();
      }
    },

    render: function() {
      if (this.template)
        this.el.$html(this.template({ amount: U.getCurrentUrlInfo().params.$amount }));

      if (!this.rendered) {
//        var menuBtnEl = this.el.querySelector('#hpRightPanel');
//        if (menuBtnEl) {
//          this.menuBtn = new MenuButton({
//            el: menuBtnEl,
//            pageView: this,
//            viewId: this.viewId,
//            homePage: true
//          });
//
//          this.menuBtn.render();
//        }
//
        this.addToWorld(null, true);
      }
//
//      this.stageBegin = this.$('.stage-begin')[0].$show();
//      this.stageReady = this.$('.stage-ready')[0];
//      this.stageError = this.$('.stage-error')[0];
//      this.stagePaid = this.$('.stage-paid')[0];
////      this.qrCode = this.$('.qr-code')[0];
//      this.stages = this.$('.blockchain');
    }
  }, {
    displayName: 'PaymentPage'
  });
});
