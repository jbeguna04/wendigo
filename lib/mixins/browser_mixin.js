/* global WendigoUtils */
"use strict";

const ErrorFactory = require('../errors/error_factory');
const utils = require('../utils');

module.exports = function BrowserMixin(s) {
    return class BrowserMixin extends s {

        constructor(page, settings) {
            super(page, settings);
        }

        text(selector) {
            this._failIfNotLoaded();
            return this.evaluate((q) => {
                const elements = WendigoUtils.queryAll(q);
                const result = [];
                for(let i = 0;i < elements.length;i++) {
                    result.push(elements[i].textContent);
                }
                return result;
            }, selector);
        }

        click(selector, index) {
            this._failIfNotLoaded();
            return this.queryAll(selector).then((elements) => {
                if(index !== undefined) {
                    if(index > elements.length || index < 0) {
                        const error = ErrorFactory.generateQueryError(`browser.click, invalid index "${index}" for selector "${selector}", ${elements.length} elements found.`);
                        return Promise.reject(error);
                    }
                    elements[index].click();
                    return 1;
                } else{
                    if(elements.length <= 0) {
                        const error = ErrorFactory.generateQueryError(`No element "${selector}" found when trying to click.`);
                        return Promise.reject(error);
                    }
                    return Promise.all(elements.map((e) => e.click())).then(() => {
                        return elements.length;
                    });
                }
            });
        }

        clickText(text, optionalText) {
            this._failIfNotLoaded();
            return this.findByText(text, optionalText).then((elements) => {
                if(elements.length <= 0) {
                    const error = ErrorFactory.generateQueryError(`No element with text "${optionalText || text}" found when trying to click.`);
                    return Promise.reject(error);
                }
                return this.click(elements);
            });
        }

        title() {
            this._failIfNotLoaded();
            return this.page.title();
        }

        html() {
            this._failIfNotLoaded();
            return this._originalHtml;
        }

        url() {
            this._failIfNotLoaded();
            return this.evaluate(() => window.location.href).then((url) => {
                if(url === "about:blank") url = null;
                return url;
            });
        }

        wait(ms = 250) {
            this._failIfNotLoaded();
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, ms);
            });
        }

        waitFor(selector, timeout = 500) {
            this._failIfNotLoaded();
            return this.page.waitForSelector(selector, {timeout: timeout, visible: true}).catch(() => {
                return Promise.reject(new Error(`Waiting for element "${selector}" failed, timeout of ${timeout}ms exceeded`));
            });
        }

        waitUntilNotVisible(selector, timeout = 500) {
            this._failIfNotLoaded();
            return this.page.waitForFunction((selector) => {
                const element = WendigoUtils.queryElement(selector);
                return !WendigoUtils.isVisible(element);
            }, {timeout: timeout}, selector).catch(() => {
                return Promise.reject(new Error(`Waiting for element "${selector}" not to be visible, timeout of ${timeout}ms exceeded`));
            });
        }

        findByText(text, optionalText) {
            this._failIfNotLoaded();
            const xPathText = optionalText || text;
            const xPath = `//*[text()='${xPathText}']`;
            if(optionalText) {
                return this.query(text).then((elem) => {
                    return this._subQueryXpath(elem, xPath);
                });
            } else {
                return this.queryXPath(xPath);
            }
        }

        findByTextContaining(text, optionalText) {
            this._failIfNotLoaded();
            const xPathText = optionalText || text;
            const xPath = `//*[contains(text(),'${xPathText}')]`;
            if(optionalText) {
                return this.query(text).then((elem) => {
                    return this._subQueryXpath(elem, xPath);
                });
            } else {
                return this.queryXPath(xPath);
            }
        }

        type(selector, text) {
            this._failIfNotLoaded();
            if(typeof selector === "string") {
                return this.page.type(selector, text);
            }else {
                return selector.type(text);
            }
        }

        keyPress(key) {
            this._failIfNotLoaded();
            if(!Array.isArray(key)) key = [key];
            const funcs = key.map(k => () => this.page.keyboard.press(k));
            return utils.promiseSerial(funcs).catch((err) => {
                return Promise.reject(new Error(err.message));
            });
        }

        uploadFile(selector, path) {
            this._failIfNotLoaded();
            return this.query(selector).then(fileInput => {
                if (fileInput) {
                    return fileInput.uploadFile(path);
                } else {
                    const error = ErrorFactory.generateQueryError(`Selector "${selector}" doesn't match any element to upload file.`);
                    return Promise.reject(error);
                }
            });
        }

        select(selector, values) {
            this._failIfNotLoaded();
            if(!Array.isArray(values)) values = [values];
            return this.page.select(selector, ...values).catch(() => {
                const error = ErrorFactory.generateQueryError(`Element "${selector}" not found when trying to select value.`);
                return Promise.reject(error);
            });
        }

        clearValue(selector) {
            this._failIfNotLoaded();
            return this.evaluate((q) => {
                const elements = WendigoUtils.queryAll(q);
                for(const element of elements) {
                    element.value = "";
                }
            }, selector);
        }

        innerHtml(selector) {
            this._failIfNotLoaded();
            return this.evaluate((q) => {
                const elements = WendigoUtils.queryAll(q);
                return Array.from(elements).map(e => e.innerHTML);
            }, selector);
        }

        setValue(selector, value) {
            this._failIfNotLoaded();
            return this.evaluate((q, v) => {
                const elements = WendigoUtils.queryAll(q);
                if(elements.length === 0) return Promise.reject();
                for(const element of elements) {
                    element.value = v;
                }
                return elements.length;
            }, selector, value).catch(() => {
                const error = ErrorFactory.generateQueryError(`Element "${selector}" not found when trying to set value "${value}".`);
                return Promise.reject(error);
            });
        }

        options(selector) {
            this._failIfNotLoaded();
            return this.evaluate((q) => {
                const element = WendigoUtils.queryElement(q);
                if(!element) return Promise.reject();
                const options = element.options || [];
                const result = [];
                for(const o of options) {
                    result.push(o.value);
                }
                return result;
            }, selector).catch(() => {
                const error = ErrorFactory.generateQueryError(`Element "${selector}" not found when trying to get options.`);
                return Promise.reject(error);
            });
        }

        selectedOptions(selector) {
            this._failIfNotLoaded();
            return this.evaluate((q) => {
                const elements = WendigoUtils.queryElement(q);
                return Array.from(elements.options).filter((option) => {
                    return option.selected;
                }).map((option) => {
                    return option.value || option.text;
                });
            }, selector).catch(() => {
                const error = ErrorFactory.generateQueryError(`Element "${selector}" not found when trying to get selected options.`);
                return Promise.reject(error);
            });
        }
    };
};