var Crawler = require("crawler");
var url = require('url');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');

function Analyzer(options) {
  var self = this;

  options = options || {};

  self.init(options);
}

util.inherits(Analyzer, EventEmitter);

Analyzer.prototype.init = function init (options) {
  var self = this;

  var defaultOptions = {
    url: false,
  };

  //return defaultOptions with overriden properties from options.
  self.options = _.extend(defaultOptions, options);

  self.crawled = [];
  self.pages = [];
  self.erros = [];
};

Analyzer.prototype.setUrl = function setUrl (url) {
  var self = this;

  self.options.url = url;
};

Analyzer.prototype.log = function log (key, message) {
  var self = this;

  self.emit(key, message);
}

Analyzer.prototype.crawl = function crawl () {
  var self = this;
  const domain = self.options.url;
  
  var c = new Crawler({
      maxConnections : 10,
      // This will be called for each crawled page
      callback : function (error, result, $) {
        // console.log('Crawling:', result.options.uri);
        //log('Pages: ' + pages.length + ' - Current: ' + result.options.uri.slice(0, 100));
        self.log('log', 'Crawling: ' + result.options.uri);
        self.log('pages');
  
        var pageObject = {
          status: result.statusCode,
          url: result.options.uri,
          pages: [],
        };
        // Add more stuff to this object.
  
        $('a[href]').each(function(index, a) {
          var toQueueUrl = $(a).attr('href');
          
          // Remove fragment.
          toQueueUrl = toQueueUrl.replace(/#(.)+/, '');
  
          // Empty links are set to a string.
          toQueueUrl = (typeof toQueueUrl == 'undefined' ? '' : toQueueUrl);
  
          // Only a slash is also set to empty string. we start with domain.
          toQueueUrl = (toQueueUrl == '/' ? '' : toQueueUrl);
    
          var includeIt = false;
    
          // Ignore internal anchor links and mailto.
          if (toQueueUrl.match(/^#/) || toQueueUrl.match(/^mailto/)) {
            includeIt = false;
          }
          // Ignore pdf and images. @TODO create array of extensions.
          else if (toQueueUrl.match(/\.pdf$/) || toQueueUrl.match(/\.jpg$/) || toQueueUrl.match(/\.png$/) || toQueueUrl.match(/\.gif$/)) {
            includeIt = false;
          }
          // Regular internal paths we add.
          else if (toQueueUrl.match(/^\//)) {
            // Internal
            includeIt = true;
            pageObject.pages.push(toQueueUrl);
          }
          else {
            includeIt = false;
          }
  
          // If page was ok, check if it's crawled and add to queue if not.
          if (self.crawled.indexOf(toQueueUrl) == -1 && includeIt) {
            self.crawled.push(toQueueUrl);
            c.queue(domain + toQueueUrl);
          }
        });
  
        self.pages.push(pageObject);
      },
      onDrain : function() {
        // console.log(JSON.stringify(pages));
        self.log('log', 'Finished crawling');
        self.log('finished');
      }
  });
  
  self.log('log', 'Start crawling ' + domain);
  c.queue(domain);
};

module.exports = Analyzer;