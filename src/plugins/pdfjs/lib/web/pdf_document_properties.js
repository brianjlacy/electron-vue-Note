/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PDFDocumentProperties = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ui_utils = require('./ui_utils');

var _pdfjs = require('./pdfjs');

var _overlay_manager = require('./overlay_manager');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_FIELD_CONTENT = '-';

var PDFDocumentProperties = function () {
  function PDFDocumentProperties(_ref) {
    var overlayName = _ref.overlayName,
        fields = _ref.fields,
        container = _ref.container,
        closeButton = _ref.closeButton;

    _classCallCheck(this, PDFDocumentProperties);

    this.overlayName = overlayName;
    this.fields = fields;
    this.container = container;
    this._reset();
    if (closeButton) {
      closeButton.addEventListener('click', this.close.bind(this));
    }
    _overlay_manager.OverlayManager.register(this.overlayName, this.container, this.close.bind(this));
  }

  _createClass(PDFDocumentProperties, [{
    key: 'open',
    value: function open() {
      var _this = this;

      var freezeFieldData = function freezeFieldData(data) {
        Object.defineProperty(_this, 'fieldData', {
          value: Object.freeze(data),
          writable: false,
          enumerable: true,
          configurable: true
        });
      };
      Promise.all([_overlay_manager.OverlayManager.open(this.overlayName), this._dataAvailableCapability.promise]).then(function () {
        if (_this.fieldData) {
          _this._updateUI();
          return;
        }
        _this.pdfDocument.getMetadata().then(function (_ref2) {
          var info = _ref2.info,
              metadata = _ref2.metadata;

          freezeFieldData({
            'fileName': (0, _ui_utils.getPDFFileNameFromURL)(_this.url),
            'fileSize': _this._parseFileSize(_this.maybeFileSize),
            'title': info.Title,
            'author': info.Author,
            'subject': info.Subject,
            'keywords': info.Keywords,
            'creationDate': _this._parseDate(info.CreationDate),
            'modificationDate': _this._parseDate(info.ModDate),
            'creator': info.Creator,
            'producer': info.Producer,
            'version': info.PDFFormatVersion,
            'pageCount': _this.pdfDocument.numPages
          });
          _this._updateUI();
          return _this.pdfDocument.getDownloadInfo();
        }).then(function (_ref3) {
          var length = _ref3.length;

          var data = (0, _ui_utils.cloneObj)(_this.fieldData);
          data['fileSize'] = _this._parseFileSize(length);
          freezeFieldData(data);
          _this._updateUI();
        });
      });
    }
  }, {
    key: 'close',
    value: function close() {
      _overlay_manager.OverlayManager.close(this.overlayName);
    }
  }, {
    key: 'setDocument',
    value: function setDocument(pdfDocument, url) {
      if (this.pdfDocument) {
        this._reset();
        this._updateUI(true);
      }
      if (!pdfDocument) {
        return;
      }
      this.pdfDocument = pdfDocument;
      this.url = url;
      this._dataAvailableCapability.resolve();
    }
  }, {
    key: 'setFileSize',
    value: function setFileSize(fileSize) {
      if (typeof fileSize === 'number' && fileSize > 0) {
        this.maybeFileSize = fileSize;
      }
    }
  }, {
    key: '_reset',
    value: function _reset() {
      this.pdfDocument = null;
      this.url = null;
      this.maybeFileSize = 0;
      delete this.fieldData;
      this._dataAvailableCapability = (0, _pdfjs.createPromiseCapability)();
    }
  }, {
    key: '_updateUI',
    value: function _updateUI() {
      var reset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (reset || !this.fieldData) {
        for (var id in this.fields) {
          this.fields[id].textContent = DEFAULT_FIELD_CONTENT;
        }
        return;
      }
      if (_overlay_manager.OverlayManager.active !== this.overlayName) {
        return;
      }
      for (var _id in this.fields) {
        var content = this.fieldData[_id];
        this.fields[_id].textContent = content || content === 0 ? content : DEFAULT_FIELD_CONTENT;
      }
    }
  }, {
    key: '_parseFileSize',
    value: function _parseFileSize() {
      var fileSize = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      var kb = fileSize / 1024;
      if (!kb) {
        return;
      } else if (kb < 1024) {
        return _ui_utils.mozL10n.get('document_properties_kb', {
          size_kb: (+kb.toPrecision(3)).toLocaleString(),
          size_b: fileSize.toLocaleString()
        }, '{{size_kb}} KB ({{size_b}} bytes)');
      }
      return _ui_utils.mozL10n.get('document_properties_mb', {
        size_mb: (+(kb / 1024).toPrecision(3)).toLocaleString(),
        size_b: fileSize.toLocaleString()
      }, '{{size_mb}} MB ({{size_b}} bytes)');
    }
  }, {
    key: '_parseDate',
    value: function _parseDate(inputDate) {
      if (!inputDate) {
        return;
      }
      var dateToParse = inputDate;
      if (dateToParse.substring(0, 2) === 'D:') {
        dateToParse = dateToParse.substring(2);
      }
      var year = parseInt(dateToParse.substring(0, 4), 10);
      var month = parseInt(dateToParse.substring(4, 6), 10) - 1;
      var day = parseInt(dateToParse.substring(6, 8), 10);
      var hours = parseInt(dateToParse.substring(8, 10), 10);
      var minutes = parseInt(dateToParse.substring(10, 12), 10);
      var seconds = parseInt(dateToParse.substring(12, 14), 10);
      var utRel = dateToParse.substring(14, 15);
      var offsetHours = parseInt(dateToParse.substring(15, 17), 10);
      var offsetMinutes = parseInt(dateToParse.substring(18, 20), 10);
      if (utRel === '-') {
        hours += offsetHours;
        minutes += offsetMinutes;
      } else if (utRel === '+') {
        hours -= offsetHours;
        minutes -= offsetMinutes;
      }
      var date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
      var dateString = date.toLocaleDateString();
      var timeString = date.toLocaleTimeString();
      return _ui_utils.mozL10n.get('document_properties_date_string', {
        date: dateString,
        time: timeString
      }, '{{date}}, {{time}}');
    }
  }]);

  return PDFDocumentProperties;
}();

exports.PDFDocumentProperties = PDFDocumentProperties;