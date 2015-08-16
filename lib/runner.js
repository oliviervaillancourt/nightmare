/**
 * Module Dependencies
 */

var parent = require('./ipc')(process);
var BrowserWindow = require('browser-window');
var sliced = require('sliced');
var renderer = require('ipc');
var app = require('app');
var fs = require('fs');

/**
 * Hide the dock
 */

// app.dock.hide();

/**
 * Listen for the app being "ready"
 */

app.on('ready', function() {
  var win = new BrowserWindow({
    show: false
  });

  /**
   * Window Docs:
   * https://github.com/atom/electron/blob/master/docs/api/browser-window.md
   */

  /**
   * Window options
   */

  win.webContents.setAudioMuted(true);

  /**
   * Pass along web content events
   */

  win.webContents.on('did-finish-load', forward('did-finish-load'));
  win.webContents.on('did-fail-load', forward('did-fail-load'));
  win.webContents.on('did-frame-finish-load', forward('did-frame-finish-load'));
  win.webContents.on('did-start-loading', forward('did-start-loading'));
  win.webContents.on('did-stop-loading', forward('did-stop-loading'));
  win.webContents.on('did-get-response-details', forward('did-get-response-details'));
  win.webContents.on('did-get-redirect-request', forward('did-get-redirect-request'));
  win.webContents.on('dom-ready', forward('dom-ready'));
  win.webContents.on('page-favicon-updated', forward('page-favicon-updated'));
  win.webContents.on('new-window', forward('new-window'));
  win.webContents.on('will-navigate', forward('will-navigate'));
  win.webContents.on('crashed', forward('crashed'));
  win.webContents.on('plugin-crashed', forward('plugin-crashed'));
  win.webContents.on('destroyed', forward('destroyed'));

  /**
   * Parent actions
   */

  parent.on('goto', function(url) {
    if (win.webContents.getUrl() == url) {
      parent.emit('goto');
    } else {
      win.webContents.loadUrl(url);
      win.webContents.once('did-finish-load', function() {
        parent.emit('goto');
      });
    }
  });

  /**
   * javascript
   */

  parent.on('javascript', function(src) {
    renderer.once('response', function(event, response) {
      parent.emit('javascript', null, response);
    });

    renderer.once('error', function(event, error) {
      parent.emit('javascript', error);
    });

    win.webContents.executeJavaScript(src);
  });

  /**
   * css
   */

  parent.on('css', function(css) {
    win.webContents.insertCSS(css);
  });

  /**
   * Send "ready" event to the parent process
   */

  parent.emit('ready');
});

/**
 * Forward events
 */

function forward(event) {
  return function () {
    parent.emit.apply(parent, [event].concat(arguments));
  };
}
