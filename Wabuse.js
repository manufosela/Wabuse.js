// Copyright 2022 manufosela.
// SPDX-License-Identifier: Apache-2.0
// Wabuse- Webcomponents Instructive Toolkit UX

// eslint-disable-next-line no-extend-native
String.prototype.interpolate = function (params = {}) {
  const keys = Object.keys(params);
  const vals = Object.values(params);
  // eslint-disable-next-line no-new-func
  return new Function(...keys, `return \`${this}\`;`)(...vals);
};

window.WabuseDATA = window.WabuseDATA || {};

class WabuseClass {
  constructor() {
    window.onload = this.init.bind(this);

  }

  init() {
    this.getTemplates();
    this.getMetas();
  }

  insertHeadContent(metaElement, response) {
    const fragment = document.createDocumentFragment();
    response.forEach((node) => {
      fragment.appendChild(node);
    });
    metaElement.replaceWith(fragment);
  }

  insertMeta(url) {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.width = 0;
      iframe.height = 0;
      iframe.src = `${url}`;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        const ifrDocument = iframe.contentDocument || iframe.contentWindow.document;
        const ifrHead = ifrDocument.querySelector('head');
        const childnodesTemplate = ifrHead.childNodes;

        iframe.remove();
        resolve(childnodesTemplate);
      };
    });
  }

  getMetas() {
    const metas = [...document.querySelectorAll('meta[name="wabuse"]')];
    metas.forEach(async (metaElement) => {
      const metaContent = metaElement.content;
      const response = await this.insertMeta(metaContent);
      this.insertHeadContent(metaElement, response);
    });
  }

  /**********************************************/

  // eslint-disable-next-line class-methods-use-this
  insertContent(templateElement, responses) {
    const fragment = document.createDocumentFragment();
    responses.forEach((response) => {
      if (Array.isArray(response)) {
        response.forEach((node) => {
          fragment.appendChild(node);
        });
      } else {
        fragment.appendChild(response);
      }
    });
    templateElement.replaceWith(fragment);
  }

  getTemplates() {
    this.templates = [...document.querySelectorAll('template[data-wabuse]')];
    this.templates.forEach(async (template) => {
      const jsonData = window.WabuseDATA[template.dataset.json] || {};
      // const jsonVarName = template.dataset.json || '';
      const tplSrc = template.dataset.src || '';
      const templateElement = document.querySelector(`template[data-src="${tplSrc}"]`);
      if (tplSrc !== '') {
        if (Array.isArray(jsonData)) {
          const arrPromises = [];
          jsonData.forEach((data) => {
            arrPromises.push(this.insertTemplate(tplSrc, data));
          });
          const responses = await Promise.all(arrPromises);
          this.insertContent(templateElement, responses);
        } else {
          const response = await this.insertTemplate(tplSrc, jsonData);
          this.insertContent(templateElement, response);
        }
      } else {
        console.info('INFO: template width "data-wabuse" attribute not found', template);
      }
    });
  }

  insertTemplate(template, data) {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.width = 0;
      iframe.height = 0;
      iframe.src = `${template}`;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        const ifrDocument = iframe.contentDocument || iframe.contentWindow.document;
        const ifrBody = ifrDocument.querySelector('body');
        const tplRaw = ifrBody.innerHTML;
        const childnodesTemplate = this.processTemplate(tplRaw, data).childNodes;

        iframe.remove();
        resolve(childnodesTemplate);
      };
    });
  }

  // eslint-disable-next-line class-methods-use-this
  fixMap(_tplRaw) {
    let tplRaw = _tplRaw.replace(/\n/g, '');
    tplRaw = tplRaw.replace(/\s{2,}/g, ' ');
    tplRaw = tplRaw.replace(/&gt;/g, '>');
    tplRaw = tplRaw.replace(/&lt;/g, '<');
    tplRaw = tplRaw.replace(/^\s+"\s/g, '');
    tplRaw = tplRaw.replace(/`\s"$/g, '`');
    tplRaw = tplRaw.replace(/\s*`\s*/g, '`');
    return tplRaw;
  }

  // eslint-disable-next-line class-methods-use-this
  processTemplate(_tplRaw, data) {
    const tplElement = document.createElement('div');
    const tplRaw = this.fixMap(_tplRaw);
    const keys = Object.keys(data);
    keys.forEach((key) => {
      if (Array.isArray(data[key])) {
        // eval(`this['${key}'] = ["${data[key].join('", "')}"];`);
        this[key] = [...data[key]];
      } else {
        // eval(`this['${key}'] = "${data[key]}";`);
        this.key = data[key];
      }
    });
    tplElement.innerHTML = (Object.keys(data).length > 0) ? tplRaw.interpolate(data) : tplRaw;
    return tplElement;
  }
}

export const Wabuse = new WabuseClass();

export function prerender(htmlObj) {
  const htmlStrings = htmlObj.strings;
  const htmlValues = htmlObj.values;
  let htmlToRender = '';
  htmlStrings.forEach((htmlString, index) => {
    htmlToRender += htmlString;
    htmlToRender += htmlValues[index] || '';
  });
  return htmlToRender;
}
