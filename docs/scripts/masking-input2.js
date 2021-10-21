class MaskingInput {
    constructor(opts) {
        if (opts && opts.masked) {
            // Make it easy to wrap this plugin and pass elements instead of a selector
            opts.masked = typeof opts.masked === 'string' ? document.querySelectorAll(opts.masked) : opts.masked;
        }

        if (opts) {
            this.opts = {
                masked: opts.masked || document.querySelectorAll(this.d.masked),
                mNum: opts.mNum || this.d.mNum,
                mChar: opts.mChar || this.d.mChar,
                onError: opts.onError || this.d.onError,
                onSuccess: opts.onSuccess || this.d.onSuccess
            };
        } else {
            this.opts = this.d;
            this.opts.masked = document.querySelectorAll(this.opts.masked);
        }
        this.complete = false;
        this.refresh(true);
    }


    // Default Values
    get d() {
        return {
            masked: '.masked',
            mNum: 'XdDmMyY9',
            mChar: '_',

            onError: function (e) {
                console.error(e);
            },
            onSuccess: (value) => {
                console.log(value);
            }
        }
    }

    refresh(init) {
        let t, parentClass;

        if (!init) {
            this.opts.masked = document.querySelectorAll(this.opts.masked);
        }

        for (let i = 0; i < this.opts.masked.length; i++) {
            t = this.opts.masked[i];
            parentClass = t.parentNode.getAttribute('class');

            if (!parentClass || (parentClass && parentClass.indexOf('shell') === -1)) {
                this.createShell(t);
                this.activateMasking(t);
            }
        }
    }

    // replaces each masked t with a shall containing the t and it's mask.
    createShell(t) {
        let wrap = document.createElement('span'),
            mask = document.createElement('span'),
            emphasis = document.createElement('i'),
            tClass = t.getAttribute('class'),
            pTxt = t.getAttribute('placeholder'),
            placeholder = document.createTextNode(pTxt);

        t.setAttribute('maxlength', placeholder.length);
        t.setAttribute('data-placeholder', pTxt);
        t.removeAttribute('placeholder');


        if (!tClass || (tClass && tClass.indexOf('masked') === -1)) {
            t.setAttribute('class', tClass + ' masked');
        }

        //mask.setAttribute('aria-hidden', 'true');
        mask.setAttribute('id', t.getAttribute('id') + 'Mask');
        mask.appendChild(emphasis);
        mask.appendChild(placeholder);

        wrap.setAttribute('class', 'shell');
        wrap.appendChild(mask);
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
    }

    setValueOfMask(e) {
        let value = e.target.value,
            placeholder = e.target.getAttribute('data-placeholder');

        return "<i>" + value + "</i>" + placeholder.substr(value.length);
    }

    // add event listeners
    activateMasking(t) {
        let that = this;

        t.addEventListener('keyup', (e) => {
            that.handleValueChange.call(that, e);
        }, false);

    }

    handleValueChange(e) {
        let id = e.target.getAttribute('id');

        if (e.target.value == document.querySelector('#' + id + 'Mask i').innerHTML) {
            return; // Continue only if value hasn't changed
        }
        let wasComplete = this.complete;
        document.getElementById(id).value = this.handleCurrentValue(e);

        document.getElementById(id + 'Mask').innerHTML = this.setValueOfMask(e);
        if (this.complete && !wasComplete) {
            this.opts.onSuccess(document.getElementById(id).value);
        }
        if (!this.complete && wasComplete) {
            this.opts.onError(document.getElementById(id).value);
        }
    }

    handleCurrentValue(e) {
        let isCharsetPresent = e.target.getAttribute('data-charset'),
            placeholder = isCharsetPresent || e.target.getAttribute('data-placeholder'),
            value = e.target.value, l = placeholder.length, newValue = '', matchesNumber, matchesLetter,
            appendThis = '',
            i, j, isInt, isLetter, strippedValue;

        // strip special characters
        strippedValue = isCharsetPresent ? value.replace(/\W/g, "") : value.replace(/\D/g, "");

        for (i = 0, j = 0; i < l; i++) {
            isInt = !isNaN(parseInt(strippedValue[j]));
            isLetter = strippedValue[j] ? strippedValue[j].match(/[A-Z]/i) : false;
            matchesNumber = this.opts.mNum.indexOf(placeholder[i]) >= 0;
            matchesLetter = this.opts.mChar.indexOf(placeholder[i]) >= 0;
            if ((matchesNumber && isInt) || (isCharsetPresent && matchesLetter && isLetter)) {
                newValue += strippedValue[j++];
            } else if ((!isCharsetPresent && !isInt && matchesNumber) || (isCharsetPresent && ((matchesLetter && !isLetter) || (matchesNumber && !isInt)))) {
                //this.opts.onError( e ); // write your own error handling function
                return newValue;
            } else {
                appendThis = placeholder[i];
                newValue += appendThis;

            }
            // break if no characters left and the pattern is non-special character
            if (strippedValue[j] == undefined) {
                break;
            }
        }
        if (placeholder = e.target.getAttribute('data-valid-example')) {
            let willReturn = this.validateProgress(e, newValue);
            let nextChar = placeholder[willReturn.length];
            if (nextChar && !this.complete) {
                matchesNumber = this.opts.mNum.indexOf(nextChar) >= 0;
                matchesLetter = this.opts.mChar.indexOf(nextChar) >= 0;
                if (!matchesLetter && !matchesNumber) {
                    console.log({ willReturn, placeholder: nextChar });
                    willReturn += nextChar;
                }

            }
            return willReturn;
        }
        return newValue;
    }

    validateProgress(e, value) {
        let validExample = e.target.getAttribute('data-valid-example'),
            pattern = new RegExp(e.target.getAttribute('pattern')),
            placeholder = e.target.getAttribute('data-placeholder'),
            l = value.length, testValue = '';

        //convert to months
        if (l == 1 && placeholder.toUpperCase().substr(0, 2) == 'MM') {
            if (value > 1 && value < 10) {
                value = '0' + value;
            }
            return value;
        }
        this.complete = pattern.test(value);
        // test the value, removing the last character, until what you have is a submatch
        for (let i = l; i >= 0; i--) {
            testValue = value + validExample.substr(value.length);

            if (pattern.test(testValue)) {

                return value;
            } else {
                value = value.substr(0, value.length - 1);
            }
        }

        return value;
    }
};


window.MaskingInput = MaskingInput