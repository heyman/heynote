import { gutters } from "@codemirror/view";
import { createI18n } from "vue3-i18n";
import { en } from "./en/en";
import { zh } from "./zh/zh";
const messages = {
  en,
  zh
};

const i18n = createI18n({
  locale: "en",
  messages: messages,
});

export default i18n;