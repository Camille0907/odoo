/** @odoo-module **/

import { session } from "@web/session";
import { browser } from "../browser/browser";
import { registry } from "../registry";
import { strftimeToLuxonFormat } from "./dates";
import { localization } from "./localization";
import { translatedTerms, _t } from "./translation";

const { Settings } = luxon;

/** @type {[RegExp, string][]} */
const NUMBERING_SYSTEMS = [
    [/^ar-(sa|sy|001)$/i, "arab"],
    [/^bn/i, "beng"],
    [/^bo/i, "tibt"],
    // [/^fa/i, "Farsi (Persian)"], // No numberingSystem found in Intl
    // [/^(hi|mr|ne)/i, "Hindi"], // No numberingSystem found in Intl
    // [/^my/i, "Burmese"], // No numberingSystem found in Intl
    [/^pa-in/i, "guru"],
    [/^ta/i, "tamldec"],
    [/.*/i, "latn"],
];

export const localizationService = {
    dependencies: ["user"],
    start: async (env, { user }) => {
        const locale = document.documentElement.getAttribute("lang") || "";
        const cacheHashes = session.cache_hashes || {};
        const translationsHash = cacheHashes.translations || new Date().getTime().toString();
        const lang = user.lang || locale.replace(/-/g, "_");
        const translationURL = session.translationURL || "/web/webclient/translations";
        let url = `${translationURL}/${translationsHash}`;
        if (lang) {
            url += `?lang=${lang}`;
        }

        const response = await browser.fetch(url);
        if (!response.ok) {
            throw new Error("Error while fetching translations");
        }

        const {
            lang_parameters: userLocalization,
            modules: modules,
            multi_lang: multiLang,
        } = await response.json();

        // FIXME We flatten the result of the python route.
        // Eventually, we want a new python route to return directly the good result.
        const terms = {};
        for (const translations of Object.values(modules)) {
            for (const [source, value] of Object.entries(translations)) {
                terms[source] = value;
            }
        }

        Object.setPrototypeOf(translatedTerms, terms);
        env._t = _t;

        if (lang) {
            // Setup lang inside luxon. The locale codes received from the server contain "_",
            // whereas the Intl codes use "-" (Unicode BCP 47). There's only one exception, which
            // is locale "sr@latin", for which we manually fallback to the "sr-Latn-RS" locale.
            const momentJSLangCodesMap = {
                "sr_RS": "sr-cyrl",
                "sr@latin": "sr-Latn-RS",
            };
            const locale = momentJSLangCodesMap[lang] || lang.replace(/_/g, "-");
            Settings.defaultLocale = locale;
            for (const [re, numberingSystem] of NUMBERING_SYSTEMS) {
                if (re.test(locale)) {
                    Settings.defaultNumberingSystem = numberingSystem;
                    break;
                }
            }
        }

        const dateFormat = strftimeToLuxonFormat(userLocalization.date_format);
        const timeFormat = strftimeToLuxonFormat(userLocalization.time_format);
        const dateTimeFormat = `${dateFormat} ${timeFormat}`;
        const grouping = JSON.parse(userLocalization.grouping);

        Object.assign(localization, {
            dateFormat,
            timeFormat,
            dateTimeFormat,
            decimalPoint: userLocalization.decimal_point,
            direction: userLocalization.direction,
            grouping,
            multiLang,
            thousandsSep: userLocalization.thousands_sep,
            weekStart: userLocalization.week_start,
        });
    },
};

registry.category("services").add("localization", localizationService);
