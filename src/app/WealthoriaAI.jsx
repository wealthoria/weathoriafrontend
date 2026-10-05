/* global React, window */
import React from "react";
import "./WealthoriaAI.css";

const { useState, useEffect, useRef, useCallback } = React;

/* =========================================================================
   WEALTHORIA AI — Smart rule-based financial education chatbot
   No external API needed. Uses keyword matching + curated responses.
   ========================================================================= */

/* ── Knowledge base ─────────────────────────────────────────────────────── */
const KB = [
  {
    tags: ["hello", "hi", "hey", "namaste", "start", "help", "who are you", "what are you"],
    en: "Hi! I'm WealthBot, Wealthoria's AI learning assistant 👋\n\nI can help you with:\n• What Wealthoria teaches\n• Stock market & investing basics\n• SIPs, mutual funds, personal finance\n• How to get started\n• Membership & courses\n\nWhat would you like to know?",
    kn: "ನಮಸ್ಕಾರ! ನಾನು WealthBot, Wealthoria ಅಧ್ಯಯನ ಸಹಾಯಕ 👋\n\nನಾನು ಈ ವಿಷಯಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n• Wealthoria ಏನು ಕಲಿಸುತ್ತದೆ\n• ಷೇರು ಮಾರುಕಟ್ಟೆ ಮೂಲಾಂಶಗಳು\n• SIP, ಮ್ಯೂಚುವಲ್ ಫಂಡ್\n• ಸದಸ್ಯತ್ವ ಮತ್ತು ಕೋರ್ಸ್\n\nನೀವು ಏನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?",
  },
  {
    tags: ["what is wealthoria", "about wealthoria", "who is wealthoria", "wealthoria"],
    en: "**Wealthoria** is a financial education company based in Mysuru, Karnataka 🎓\n\nWe teach people how money and markets actually work — *before* they invest a single rupee.\n\n🌟 Key facts:\n• Founded by Sandeep M. Kalburgi & Manjunath K.S.\n• 800+ active clients across Karnataka\n• 1,200+ learning hours delivered\n• Teaching in **Kannada and English**\n• No tips, no signals — only real education",
    kn: "**Wealthoria** ಮೈಸೂರಿನಲ್ಲಿ ನೆಲೆಸಿದ ಹಣಕಾಸು ಶಿಕ್ಷಣ ಸಂಸ್ಥೆ 🎓\n\nಹಣ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂದು ಒಂದು ರೂಪಾಯಿ ಹೂಡುವ ಮೊದಲೇ ಕಲಿಸುತ್ತೇವೆ.\n\n🌟 ಮುಖ್ಯ ವಿಷಯಗಳು:\n• 800+ ಸಕ್ರಿಯ ಗ್ರಾಹಕರು\n• 1,200+ ಕಲಿಕಾ ಗಂಟೆಗಳು\n• ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕಲಿಕೆ",
  },
  {
    tags: ["sip", "systematic investment plan", "monthly investment", "sip meaning"],
    en: "**SIP — Systematic Investment Plan** 📅\n\nA SIP lets you invest a fixed amount every month into a mutual fund — automatically.\n\n✅ Why SIPs are powerful:\n• **Rupee Cost Averaging**: you buy more units when prices are low\n• **Compounding**: your returns earn returns over time\n• **Discipline**: removes emotional decisions\n• Start with as little as ₹500/month\n\n⚠️ Key truth: SIPs are not guaranteed. They are market-linked. The power is in *staying invested long-term*.\n\nWant to learn more about mutual funds?",
    kn: "**SIP — Systematic Investment Plan** 📅\n\nSIP ಎಂದರೆ ಪ್ರತಿ ತಿಂಗಳು ನಿಗದಿತ ಮೊತ್ತವನ್ನು ಮ್ಯೂಚುವಲ್ ಫಂಡ್‌ಗೆ ಹೂಡುವುದು.\n\n✅ SIP ಶಕ್ತಿ:\n• ರೂಪಾಯಿ ಸರಾಸರಿ ವೆಚ್ಚ\n• ಚಕ್ರಬಡ್ಡಿ ಲಾಭ\n• ₹500/ತಿಂಗಳಿಂದ ಆರಂಭಿಸಬಹುದು",
  },
  {
    tags: ["mutual fund", "mf", "what is mutual fund", "fund"],
    en: "**What is a Mutual Fund?** 🏦\n\nA mutual fund pools money from many investors and invests it in stocks, bonds, or both — managed by a professional fund manager.\n\n📌 Types you should know:\n• **Equity funds** — invest in stocks (higher risk, higher return potential)\n• **Debt funds** — invest in bonds (lower risk, stable returns)\n• **Hybrid funds** — mix of both\n\n💡 For beginners: Index funds (like Nifty 50 index funds) are a great starting point — low cost, diversified, and no fund manager bias.\n\n⚠️ Always check: expense ratio, fund house reputation, and your investment horizon.",
    kn: "**ಮ್ಯೂಚುವಲ್ ಫಂಡ್ ಎಂದರೇನು?** 🏦\n\nಅನೇಕ ಹೂಡಿಕೆದಾರರ ಹಣವನ್ನು ಒಟ್ಟುಗೂಡಿಸಿ ಷೇರು ಅಥವಾ ಬಾಂಡ್‌ಗಳಲ್ಲಿ ಹೂಡುವ ಯೋಜನೆ.\n\n📌 ಮುಖ್ಯ ವಿಧಗಳು:\n• ಇಕ್ವಿಟಿ ಫಂಡ್ (ಷೇರುಗಳಲ್ಲಿ)\n• ಡೆಟ್ ಫಂಡ್ (ಬಾಂಡ್‌ಗಳಲ್ಲಿ)\n• ಹೈಬ್ರಿಡ್ ಫಂಡ್ (ಎರಡೂ)",
  },
  {
    tags: ["stock market", "share market", "stock", "shares", "equity", "sensex", "nifty"],
    en: "**Stock Market Basics** 📈\n\nWhen you buy a share, you own a small piece of a company. If the company grows and earns more, your share becomes more valuable.\n\n🔑 Key concepts:\n• **Nifty 50** — index of 50 largest companies on NSE\n• **Sensex** — index of 30 largest companies on BSE\n• **Bull market** — rising market (optimism)\n• **Bear market** — falling market (pessimism)\n\n📚 At Wealthoria, we teach stock market fundamentals from scratch — in Kannada and English.\n\n⚠️ Important: The stock market is not a casino. Short-term trading is risky. Long-term, patient investing in good companies builds real wealth.",
    kn: "**ಷೇರು ಮಾರುಕಟ್ಟೆ ಮೂಲಾಂಶಗಳು** 📈\n\nಷೇರು ಖರೀದಿಸಿದಾಗ ನೀವು ಕಂಪನಿಯ ಪಾಲುದಾರರಾಗುತ್ತೀರಿ. ಕಂಪನಿ ಬೆಳೆದರೆ ನಿಮ್ಮ ಷೇರಿನ ಮೌಲ್ಯ ಹೆಚ್ಚಾಗುತ್ತದೆ.\n\n🔑 ಮುಖ್ಯ ಪದಗಳು:\n• Nifty 50 — NSE ಯ 50 ದೊಡ್ಡ ಕಂಪನಿಗಳ ಸೂಚ್ಯಂಕ\n• Sensex — BSE ಯ 30 ಕಂಪನಿಗಳ ಸೂಚ್ಯಂಕ",
  },
  {
    tags: ["risk", "investment risk", "how risky", "safe investment", "safe"],
    en: "**Understanding Risk** ⚖️\n\nAt Wealthoria, we teach *risk before return* — it's our core philosophy.\n\n📊 Risk levels (general):\n• **High risk**: Direct stocks, small-cap funds, F&O trading\n• **Medium risk**: Large-cap equity funds, hybrid funds\n• **Lower risk**: Debt funds, PPF, FD\n• **Very low risk**: Government bonds, liquid funds\n\n🧠 Key insight: Risk isn't just about losing money. It's about *volatility* — how much your investment's value goes up and down. Volatility is manageable if your time horizon is long.\n\n⚠️ Never invest money you need in the next 1–2 years in equity.",
    kn: "**ಅಪಾಯ ಅರ್ಥ ಮಾಡಿಕೊಳ್ಳಿ** ⚖️\n\nWealthoria ನಲ್ಲಿ ಲಾಭಕ್ಕೂ ಮೊದಲು ಅಪಾಯ ಕಲಿಸುತ್ತೇವೆ.\n\n📊 ಅಪಾಯ ಮಟ್ಟಗಳು:\n• ಹೆಚ್ಚು ಅಪಾಯ: ನೇರ ಷೇರು, ಸ್ಮಾಲ್ ಕ್ಯಾಪ್\n• ಮಧ್ಯಮ: ಲಾರ್ಜ್ ಕ್ಯಾಪ್ ಫಂಡ್\n• ಕಡಿಮೆ: PPF, FD, ಡೆಟ್ ಫಂಡ್",
  },
  {
    tags: ["member", "membership", "join", "subscribe", "sign up", "register", "how to join"],
    en: "**Wealthoria Membership** 🌟\n\nOur membership gives you access to:\n• 📹 Exclusive video lessons on investing & markets\n• 📊 Weekly market round-ups and analysis\n• 📚 Member-only articles and resources\n• 📰 Latest financial education content\n\n💳 Membership is available at **₹99/month**\n\nTo become a member:\n1. Click **'Become a Member'** on the homepage\n2. Create your account\n3. Subscribe and get instant access\n\nHave more questions? Email support@wealthoria.in",
    kn: "**Wealthoria ಸದಸ್ಯತ್ವ** 🌟\n\nಸದಸ್ಯತ್ವದಲ್ಲಿ ಲಭ್ಯ:\n• ಎಕ್ಸ್‌ಕ್ಲೂಸಿವ್ ವೀಡಿಯೊ ಪಾಠಗಳು\n• ಸಾಪ್ತಾಹಿಕ ಮಾರುಕಟ್ಟೆ ವಿಶ್ಲೇಷಣೆ\n• ಸದಸ್ಯ-ಮಾತ್ರ ಲೇಖನಗಳು\n\n💳 ₹99/ತಿಂಗಳು\n\nಸದಸ್ಯರಾಗಲು 'Become a Member' ಕ್ಲಿಕ್ ಮಾಡಿ",
  },
  {
    tags: ["personal finance", "budget", "saving", "budgeting", "emergency fund", "savings"],
    en: "**Personal Finance Fundamentals** 💰\n\nBefore investing, get your personal finance right:\n\n✅ The basics:\n1. **Emergency fund** — 3–6 months of expenses in a liquid account\n2. **Zero high-interest debt** — clear credit card debt before investing\n3. **Insurance first** — adequate term life + health insurance\n4. **Budget** — know your income, expenses, and surplus\n5. **Only then invest** — with money you won't need for 3+ years\n\n🧠 Wealthoria's Personal Finance program covers all of this step by step.",
    kn: "**ವೈಯಕ್ತಿಕ ಹಣಕಾಸು ಮೂಲಾಂಶಗಳು** 💰\n\nಹೂಡಿಕೆಗೆ ಮೊದಲು:\n\n✅ ಮೂಲಭೂತ ಹಂತಗಳು:\n1. ತುರ್ತು ನಿಧಿ (3–6 ತಿಂಗಳ ಖರ್ಚು)\n2. ಹೆಚ್ಚಿನ ಬಡ್ಡಿ ಸಾಲ ತೀರಿಸಿ\n3. ವಿಮೆ ತೆಗೆದುಕೊಳ್ಳಿ\n4. ಬಜೆಟ್ ಮಾಡಿ\n5. ಆಗ ಮಾತ್ರ ಹೂಡಿಕೆ",
  },
  {
    tags: ["compounding", "compound interest", "how money grows", "power of compounding"],
    en: "**The Power of Compounding** 🚀\n\nEinstein called compound interest the *eighth wonder of the world* — and for good reason.\n\n📊 Example:\n• Invest ₹5,000/month for 20 years at 12% annual return\n• Total invested: ₹12 lakhs\n• Value after 20 years: **~₹50 lakhs!**\n\nThe secret? Your **returns earn returns**. The longer you stay invested, the more powerful it becomes.\n\n⏰ This is why starting early matters more than the amount. Even ₹500/month at age 22 beats ₹5,000/month at age 35.\n\nWant to explore our SIP Calculator?",
    kn: "**ಚಕ್ರಬಡ್ಡಿ ಶಕ್ತಿ** 🚀\n\n📊 ಉದಾಹರಣೆ:\n• ₹5,000/ತಿಂಗಳು 20 ವರ್ಷ (12% ಆದಾಯ)\n• ಒಟ್ಟು ಹೂಡಿಕೆ: ₹12 ಲಕ್ಷ\n• 20 ವರ್ಷದ ನಂತರ: **~₹50 ಲಕ್ಷ!**\n\nಬೇಗ ಆರಂಭಿಸುವುದೇ ಮೊದಲ ಕೆಲಸ.",
  },
  {
    tags: ["kannada", "language", "hindi", "english", "telugu", "regional", "my language"],
    en: "**Learning in Your Language** 🗣️\n\nWealthoria is built on the belief that language should *never* be a barrier to financial literacy.\n\nWe teach in:\n• **Kannada** — core programs and many seminars\n• **English** — all content available in English too\n\nOur YouTube channel (Stock Market Kannada) has 1 lakh+ subscribers learning in Kannada!\n\nAll our member portal content is available in both languages.",
    kn: "**ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಕಲಿಕೆ** 🗣️\n\nWealthoria ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕಲಿಸುತ್ತದೆ.\n\nನಮ್ಮ YouTube ಚಾನಲ್ 'Stock Market Kannada' ಗೆ 1 ಲಕ್ಷಕ್ಕೂ ಹೆಚ್ಚು ಚಂದಾದಾರರಿದ್ದಾರೆ!",
  },
  {
    tags: ["founder", "sandeep", "manjunath", "who founded", "who started", "team", "about founders"],
    en: "**Meet Our Founders** 👥\n\n**Sandeep M. Kalburgi** — Director, Business & Management\n• 5+ years personal investment journey\n• NISM certified (NISM I, VA, VII, VIII)\n• NSE, BSE, MCX broking license holder\n• *'Every share represents a piece of human productivity. Invest in that, not in price movements.'*\n\n**Manjunath K.S.** — Director, Research & Content\n• NISM Certified Research Analyst\n• Creator of Stock Market Kannada (1L+ subscribers)\n• 10+ years personal investment journey\n• *'The goal of investing is not to beat everyone else. It is to secure your financial independence.'*",
    kn: "**ಸಂಸ್ಥಾಪಕರು** 👥\n\n**ಸಂದೀಪ್ ಎಂ. ಕಲಬುರ್ಗಿ** — ವ್ಯವಹಾರ ನಿರ್ದೇಶಕ\n• NISM ಪ್ರಮಾಣಿತ\n\n**ಮಂಜುನಾಥ್ ಕೆ.ಎಸ್.** — ಸಂಶೋಧನಾ ನಿರ್ದೇಶಕ\n• Stock Market Kannada (1L+ ಚಂದಾದಾರರು)",
  },
  {
    tags: ["tips", "stock tips", "signals", "recommendation", "pick stocks", "which stock"],
    en: "**On Stock Tips & Signals** 🚫\n\nWealthoria does **not** give stock tips, signals, or stock recommendations — and here's why that's a good thing:\n\n🧠 Tips-based investing is dangerous because:\n• You don't understand *why* to buy/sell\n• You can't handle a 30% drop with conviction\n• You become dependent on someone else\n• Most tips are not in your best interest\n\n✅ What we do instead:\nWe teach you how to **evaluate companies yourself** using fundamental analysis — so every decision is yours, informed and confident.\n\n*That's the Wealthoria difference.*",
    kn: "**ಷೇರು ಸಲಹೆಗಳ ಬಗ್ಗೆ** 🚫\n\nWealthoria ಯಾವುದೇ ಷೇರು ಸಲಹೆ ನೀಡುವುದಿಲ್ಲ.\n\nನಾವು ನಿಮಗೆ ಸ್ವತಃ ನಿರ್ಧರಿಸುವ ಶಕ್ತಿ ಕೊಡುತ್ತೇವೆ — ಮೂಲಭೂತ ವಿಶ್ಲೇಷಣೆ ಕಲಿಸುತ್ತೇವೆ.",
  },
  {
    tags: ["beginner", "start investing", "how to start", "new investor", "first time", "i am new"],
    en: "**Starting from Zero — Your Roadmap** 🗺️\n\nWealthoria recommends this order for first-time investors:\n\n**Step 1:** Understand money basics (income, expenses, saving)\n**Step 2:** Build an emergency fund (3–6 months expenses)\n**Step 3:** Get term life & health insurance\n**Step 4:** Learn what investing is (and isn't)\n**Step 5:** Start with index mutual funds via SIP\n**Step 6:** Learn fundamental analysis — then consider direct stocks\n\n🎓 We guide you through every step in our programs.\n\nWant to become a member and start learning today?",
    kn: "**ಶೂನ್ಯದಿಂದ ಆರಂಭ — ನಿಮ್ಮ ರೋಡ್‌ಮ್ಯಾಪ್** 🗺️\n\n**ಹಂತ 1:** ಹಣದ ಮೂಲಾಂಶಗಳು ಅರ್ಥ ಮಾಡಿ\n**ಹಂತ 2:** ತುರ್ತು ನಿಧಿ ಕಟ್ಟಿ\n**ಹಂತ 3:** ವಿಮೆ ತೆಗೆಯಿರಿ\n**ಹಂತ 4:** SIP ಮೂಲಕ ಮ್ಯೂಚುವಲ್ ಫಂಡ್ ಆರಂಭಿಸಿ\n**ಹಂತ 5:** ಮೂಲಭೂತ ವಿಶ್ಲೇಷಣೆ ಕಲಿಯಿರಿ",
  },
  {
    tags: ["contact", "reach out", "phone", "email", "address", "location", "where", "mysore", "mysuru"],
    en: "**Contact Wealthoria** 📞\n\n📧 **Email:** support@wealthoria.in\n📱 **Phone:** +91 90197 59001\n📍 **Address:** No.2687/1, D-1, 2nd Floor, 5th Cross, Kalidasa Road, V V Mohalla, Mysore - 570002\n🌐 **Website:** www.wealthoria.in\n\nOur team typically responds within 1 working day.",
    kn: "**Wealthoria ಸಂಪರ್ಕ** 📞\n\n📧 support@wealthoria.in\n📱 +91 90197 59001\n📍 ಮೈಸೂರು - 570002",
  },
  {
    tags: ["course", "program", "curriculum", "what do you teach", "lessons", "what can i learn"],
    en: "**Wealthoria Programs** 📚\n\nOur structured learning programs:\n\n1. 📈 **Stock Market Fundamentals** — How shares, indices & markets work (Beginner, 8 modules)\n2. 🏦 **Mutual Funds & SIPs** — Build wealth through diversified funds (Beginner, 6 modules)\n3. 💰 **Personal Finance** — Budgeting, saving, debt & emergency funds (Beginner, 7 modules)\n4. 🎯 **Financial Planning** — Set goals, plan life events (Intermediate, 5 modules)\n5. 🧠 **Investor Psychology** — Master fear, greed & patience (Intermediate, 4 modules)\n6. ⚖️ **Asset Allocation** — Balance equity, debt & gold (Advanced, 5 modules)\n\n💡 All programs available in Kannada & English!",
    kn: "**Wealthoria ಕಾರ್ಯಕ್ರಮಗಳು** 📚\n\n1. ಷೇರು ಮಾರುಕಟ್ಟೆ ಮೂಲಾಂಶಗಳು (8 ಮಾಡ್ಯೂಲ್)\n2. ಮ್ಯೂಚುವಲ್ ಫಂಡ್ ಮತ್ತು SIP (6 ಮಾಡ್ಯೂಲ್)\n3. ವೈಯಕ್ತಿಕ ಹಣಕಾಸು (7 ಮಾಡ್ಯೂಲ್)\n4. ಹಣಕಾಸು ಯೋಜನೆ (5 ಮಾಡ್ಯೂಲ್)\n5. ಹೂಡಿಕೆದಾರ ಮನೋವಿಜ್ಞಾನ (4 ಮಾಡ್ಯೂಲ್)\n6. ಆಸ್ತಿ ಹಂಚಿಕೆ (5 ಮಾಡ್ಯೂಲ್)",
  },
  {
    tags: ["fundamental analysis", "fa", "pe ratio", "pe", "balance sheet", "valuation", "how to pick stocks"],
    en: "**Fundamental Analysis** 🔍\n\nFundamental analysis is how you evaluate if a company is worth investing in.\n\n📊 Key metrics to learn:\n• **P/E Ratio** — how much you're paying per rupee of earnings\n• **Revenue & profit growth** — is the company actually growing?\n• **Debt-to-equity ratio** — is it over-leveraged?\n• **Return on Equity (ROE)** — how well does it use shareholder money?\n• **Management quality** — who runs the company?\n\n🎓 Wealthoria's Fundamental Analysis Lab teaches this step-by-step.\n\n⚠️ Remember: even great companies can be bad investments at the wrong price.",
    kn: "**ಮೂಲಭೂತ ವಿಶ್ಲೇಷಣೆ** 🔍\n\nಕಂಪನಿ ಹೂಡಿಕೆಗೆ ಯೋಗ್ಯವೇ ಎಂದು ಮೌಲ್ಯಮಾಪನ ಮಾಡುವ ವಿಧಾನ.\n\n📊 ಮುಖ್ಯ ಮಾಪದಂಡಗಳು:\n• P/E ಅನುಪಾತ\n• ಆದಾಯ ಮತ್ತು ಲಾಭ ಬೆಳವಣಿಗೆ\n• ಸಾಲ-ಇಕ್ವಿಟಿ ಅನುಪಾತ\n• ROE",
  },
  {
    tags: ["youtube", "channel", "video", "watch", "free content", "free videos"],
    en: "**Free Content on YouTube** 🎥\n\nOur YouTube channel **Stock Market Kannada** has 1 lakh+ subscribers!\n\n🎬 Popular videos:\n• 'What is a mutual fund? Explained simply' — 24K views\n• 'SIP vs Lumpsum: Which is right for you?' — 31K views\n• '5 money mistakes first-time investors make' — 18K views\n\nAll content is in **Kannada and English** — new videos every week.\n\n👉 Search 'Stock Market Kannada' on YouTube to find us!",
    kn: "**YouTube ಉಚಿತ ವಿಷಯ** 🎥\n\nನಮ್ಮ 'Stock Market Kannada' ಚಾನಲ್‌ಗೆ 1 ಲಕ್ಷಕ್ಕೂ ಹೆಚ್ಚು ಚಂದಾದಾರರಿದ್ದಾರೆ!\n\nYouTube ನಲ್ಲಿ 'Stock Market Kannada' ಹುಡುಕಿ.",
  },
  {
    tags: ["price", "cost", "fee", "how much", "expensive", "affordable"],
    en: "**Wealthoria Pricing** 💳\n\n🌟 **Membership**: ₹99 per month\n\nYour membership includes:\n• All exclusive video lessons\n• Weekly market round-ups\n• Member-only articles & resources\n• Access to the full member portal\n\n🆓 **Free content**:\n• YouTube channel (Stock Market Kannada)\n• Knowledge library (guides, calculators, cheat-sheets)\n• Select seminars and webinars\n\nYou can start learning for free and upgrade to membership anytime!",
    kn: "**Wealthoria ಬೆಲೆ** 💳\n\n🌟 ಸದಸ್ಯತ್ವ: ₹99/ತಿಂಗಳು\n\n🆓 ಉಚಿತ: YouTube ಚಾನಲ್, ಜ್ಞಾನ ಗ್ರಂಥಾಲಯ, ಆಯ್ದ ಸೆಮಿನಾರ್‌ಗಳು",
  },
  {
    tags: ["refund", "cancel", "cancellation", "money back", "unsubscribe"],
    en: "**Cancellation & Refund Policy** 📋\n\n• Subscription payments are **generally non-refundable** once a period has started\n• You can **cancel auto-debit** anytime — your access continues until the paid period ends\n• After cancellation, you can re-subscribe using the same email\n• Eligible refunds (e.g., if Wealthoria cancels a service) are processed as applicable\n\n📧 For refund queries: support@wealthoria.in",
    kn: "**ರದ್ದತಿ ಮತ್ತು ಮರುಪಾವತಿ** 📋\n\n• ಪಾವತಿ ಸಾಮಾನ್ಯವಾಗಿ ಮರುಪಾವತಿ ಯೋಗ್ಯವಲ್ಲ\n• Auto-debit ಯಾವಾಗಲಾದರೂ ರದ್ದು ಮಾಡಬಹುದು\n• 📧 support@wealthoria.in",
  },
  {
    tags: [
      "paid but cannot login",
      "paid but not able to login",
      "paid but unable to login",
      "payment done but cannot login",
      "payment done cannot login",
      "paid money but cannot login",
      "paid money not able to login",
      "paid not able to login",
      "paid cannot login",
      "login problem",
      "login issue",
      "unable to login",
      "cannot login",
      "can't login",
      "not able to login",
      "forgot password",
      "password reset",
      "how to login after payment",
      "paid",
      "login"
    ],
    en: "**Paid but unable to login? Here is what to do:** 🔑\n\nDon't worry! If you have completed payment but are unable to log in:\n\n1. Go to the **Member Login** page (`/members/login`)\n2. Click on **\"Forgot Password\"** below the form\n3. Enter your **registered email address** (the email used during payment)\n4. Check your email inbox/spam for the **verification code**\n5. Enter the verification code and set a **new password**\n6. Once changed, return to login and sign in with your new password!\n\n💡 *Note:* Please ensure you enter the exact same email address you used when making the payment.\n\nStill facing issues? Reach our team directly:\n📧 **support@wealthoria.in** | 📱 **+91 90197 59001**",
    kn: "**ಹಣ ಪಾವತಿಸಿದರೂ ಲಾಗಿನ್ ಆಗುತ್ತಿಲ್ಲವೇ? ಹೀಗೆ ಮಾಡಿ:** 🔑\n\nಚಿಂತೆ ಮಾಡಬೇಡಿ! ನೀವು ಪಾವತಿ ಪೂರ್ಣಗೊಳಿಸಿದ್ದು ಲಾಗಿನ್ ಆಗಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೆ:\n\n1. **Member Login** ಪುಟಕ್ಕೆ ಹೋಗಿ (`/members/login`)\n2. ಲಾಗಿನ್ ಫಾರ್ಮ್ ಕೆಳಗಿರುವ **\"Forgot Password\"** ಕ್ಲಿಕ್ ಮಾಡಿ\n3. ಪಾವತಿಗೆ ಬಳಸಿದ ನಿಮ್ಮ **ನೋಂದಾಯಿತ ಇಮೇಲ್** ನಮೂದಿಸಿ\n4. ಇಮೇಲ್‌ಗೆ ಬರುವ **ಪರಿಶೀಲನಾ ಕೋಡ್ (Verification Code)** ಅನ್ನು ನಮೂದಿಸಿ\n5. **ಹೊಸ ಪಾಸ್‌ವರ್ಡ್** ಸೆಟ್ ಮಾಡಿ\n6. ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿದ ನಂತರ, ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ ಪುನಃ ಲಾಗಿನ್ ಮಾಡಿ!\n\n💡 *ಸೂಚನೆ:* ಪಾವತಿ ಮಾಡುವಾಗ ಬಳಸಿದ ಅದೇ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.\n\nಇನ್ನೂ ಸಮಸ್ಯೆ ಇದ್ದರೆ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ:\n📧 **support@wealthoria.in** | 📱 **+91 90197 59001**",
  },
];

/* Suggested quick-tap questions shown at start */
const SUGGESTIONS = {
  en: [
    "What is Wealthoria?",
    "How many days left on my subscription?",
    "Paid but can't login?",
    "What is a SIP?",
    "Tell me about membership",
    "How to contact you?",
  ],
  kn: [
    "Wealthoria ಏನು?",
    "ಚಂದಾದಾರಿಕೆ ದಿನಗಳು ಎಷ್ಟು ಬಾಕಿ ಇವೆ?",
    "ಪಾವತಿಸಿದರೂ ಲಾಗಿನ್ ಆಗುತ್ತಿಲ್ಲವೇ?",
    "SIP ಎಂದರೇನು?",
    "ಸದಸ್ಯತ್ವ ಬಗ್ಗೆ ತಿಳಿಸಿ",
  ],
};

/* ── Date and timestamp helpers ─────────────────────────────────────────── */
function toMillis(value) {
  if (!value) return 0;
  try {
    if (typeof value.toDate === "function") return value.toDate().getTime();
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value === "number") return value > 1e11 ? value : value * 1000;
    if (typeof value === "object" && value._seconds) {
      return value._seconds * 1000 + Math.round((value._nanoseconds || 0) / 1e6);
    }
    const date = new Date(value);
    const time = date.getTime();
    return Number.isNaN(time) ? 0 : time;
  } catch {
    return 0;
  }
}

function formatDate(millis, lang = "en") {
  if (!millis) return "—";
  try {
    const d = new Date(millis);
    return d.toLocaleDateString(lang === "kn" ? "kn-IN" : "en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  } catch {
    return "—";
  }
}

/* ── Subscription query intent & contact extraction ─────────────────────── */
function isSubscriptionQuery(text) {
  const t = text.toLowerCase();
  return (
    t.includes("day") ||
    t.includes("left") ||
    t.includes("cancel") ||
    t.includes("subscri") ||
    t.includes("expire") ||
    t.includes("remaining") ||
    t.includes("status") ||
    t.includes("ರದ್ದು") ||
    t.includes("ದಿನ") ||
    t.includes("ಬಾಕಿ") ||
    t.includes("ಮುಕ್ತಾಯ") ||
    t.includes("ಚಂದಾದಾರಿಕೆ")
  );
}

function extractContact(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+91[\-\s]?)?[6-9]\d{9}\b/);
  const rawDigits = text.replace(/\D/g, "");

  const email = emailMatch ? emailMatch[0].toLowerCase().trim() : null;
  const phone = phoneMatch
    ? phoneMatch[0].replace(/\D/g, "").slice(-10)
    : (rawDigits.length === 10 ? rawDigits : null);

  return { email, phone, hasContact: Boolean(email || phone) };
}

/* ── Which subscription record decides access ──────────────────────────── */
// Same rule as the backend /subscription/status-check:
// only paid records count; an active one wins; otherwise the paid record
// whose period ends last. (Sorting by "last updated" picked old records the
// expiry job had just touched, so members with several subscriptions were
// wrongly told they had expired.)
function isPaidSubscriptionRecord(sub) {
  if (sub.razorpayPaymentId) return true;
  const paidCount = Number(sub.paidCount);
  if (sub.paidCount !== undefined && sub.paidCount !== null && Number.isFinite(paidCount)) {
    return paidCount > 0;
  }
  return ["active", "cancelled", "halted", "paused", "inactive"].includes(
    String(sub.status || "").toLowerCase()
  );
}

function pickStatusSubscription(subscriptions) {
  const paid = subscriptions.filter(isPaidSubscriptionRecord);
  const pool = paid.length ? paid : subscriptions;
  const latestEnd = (a, b) =>
    toMillis(b.nextBillingDate) - toMillis(a.nextBillingDate) ||
    toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt);
  const active = pool
    .filter((s) => String(s.status || "").toLowerCase() === "active")
    .sort(latestEnd);
  if (active.length) return active[0];
  return [...pool].sort(latestEnd)[0] || null;
}

/* ── Real-time subscription lookup (Firestore + API fallback) ───────────── */
async function lookupSubscriptionStatus(contactInput, lang = "en") {
  const clean = String(contactInput || "").trim();
  const { email, phone } = extractContact(clean);
  const queryEmail = email || (clean.includes("@") ? clean.toLowerCase() : null);
  const queryPhone = phone || (clean.replace(/\D/g, "").length >= 10 ? clean.replace(/\D/g, "").slice(-10) : null);

  let member = null;
  let subscriptions = [];

  /* 1. Try Client Firestore (window.db) */
  if (typeof window !== "undefined" && window.db && typeof window.db.collection === "function") {
    try {
      if (queryEmail) {
        const [subSnap, memSnap] = await Promise.all([
          window.db.collection("subscriptions").where("email", "==", queryEmail).get().catch(() => null),
          window.db.collection("members").where("email", "==", queryEmail).limit(1).get().catch(() => null)
        ]);
        if (subSnap && !subSnap.empty) {
          subscriptions = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        if (memSnap && !memSnap.empty) {
          member = memSnap.docs[0].data();
        }
        if (member?.uid && subscriptions.length === 0) {
          const subByUid = await window.db.collection("subscriptions").where("memberId", "==", member.uid).get().catch(() => null);
          if (subByUid && !subByUid.empty) {
            subscriptions = subByUid.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        }
      } else if (queryPhone) {
        const [subSnap, memSnap] = await Promise.all([
          window.db.collection("subscriptions").where("phone", "==", queryPhone).get().catch(() => null),
          window.db.collection("members").where("phone", "==", queryPhone).limit(1).get().catch(() => null)
        ]);
        if (subSnap && !subSnap.empty) {
          subscriptions = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        if (memSnap && !memSnap.empty) {
          member = memSnap.docs[0].data();
        }
      }
    } catch (e) {
      console.warn("Client Firestore lookup error:", e);
    }
  }

  /* 2. Fallback to Cloud Function API if not found via window.db */
  if (!member && subscriptions.length === 0) {
    const API_BASE =
      typeof window !== "undefined" && window.WEALTHORIA_API_BASE !== undefined
        ? `${window.WEALTHORIA_API_BASE}/api`
        : "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api";

    try {
      const resp = await fetch(`${API_BASE}/subscription/status-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryEmail || queryPhone || clean })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.found) {
          return formatSubscriptionMessage(data, lang);
        }
      }
    } catch (apiErr) {
      console.warn("API status-check fetch error:", apiErr);
    }
  }

  /* If still nothing found */
  if (!member && subscriptions.length === 0) {
    return lang === "kn"
      ? `ಕ್ಷಮಿಸಿ, **${clean}** ಗೆ ಸಂಬಂಧಿಸಿದ ಯಾವುದೇ ನೋಂದಾಯಿತ ಸದಸ್ಯತ್ವ ಅಥವಾ ಚಂದಾದಾರಿಕೆ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ.\n\nದಯವಿಟ್ಟು ನೀವು ಪಾವತಿಗೆ ಬಳಸಿದ ಸರಿಯಾದ ಇಮೇಲ್ ಅಥವಾ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.\n\nಸಹಾಯಕ್ಕೆ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ:\n📧 **support@wealthoria.in** | 📱 **+91 90197 59001**`
      : `We couldn't find any account matching **${clean}**.\n\nPlease ensure you entered the exact registered email address or 10-digit mobile number used during payment.\n\nNeed assistance? Reach our support team:\n📧 **support@wealthoria.in** | 📱 **+91 90197 59001**`;
  }

  /* Process Firestore records: use the record that decides access
     (an active one, otherwise the paid one whose period ends last) */
  const latestSub = pickStatusSubscription(subscriptions);

  const now = Date.now();
  const expiryRaw = latestSub?.nextBillingDate || member?.nextBillingDate || null;
  const expiryMs = toMillis(expiryRaw);
  const daysLeft = expiryMs ? Math.ceil((expiryMs - now) / (1000 * 60 * 60 * 24)) : null;

  const status = String(latestSub?.status || latestSub?.razorpayStatus || member?.status || "inactive").toLowerCase();
  const razorpayStatus = String(latestSub?.razorpayStatus || "").toLowerCase();
  const isCancelled =
    ["cancelled", "halted", "paused", "expired"].includes(status) ||
    ["cancelled", "halted", "paused"].includes(razorpayStatus);
  const isActive = status === "active" && !isCancelled;

  return formatSubscriptionMessage({
    found: true,
    // Never show the account holder's name for a typed email / phone.
    name: "",
    status,
    isCancelled,
    isActive,
    daysLeft,
    nextBillingDate: expiryRaw,
    plan: latestSub?.plan || "Wealthoria Membership",
    amount: latestSub?.amount || 99
  }, lang);
}

/* ── Format final response for user ─────────────────────────────────────── */
function formatSubscriptionMessage(info, lang = "en") {
  const expiryMs = toMillis(info.nextBillingDate);
  const formattedDate = formatDate(expiryMs, lang);
  const daysLeft = info.daysLeft !== null && info.daysLeft !== undefined ? info.daysLeft : null;
  const nameGreeting = info.name && info.name !== "—" ? ` (${info.name})` : "";

  // 1. Cancelled subscription with days remaining
  if (info.isCancelled && daysLeft !== null && daysLeft > 0) {
    if (lang === "kn") {
      return (
        `📋 **ಚಂದಾದಾರಿಕೆ ಸ್ಥಿತಿ: ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ (Cancelled)**${nameGreeting}\n\n` +
        `ನಿಮ್ಮ ಚಂದಾದಾರಿಕೆಯಲ್ಲಿ ಇನ್ನೂ **${daysLeft} ದಿನಗಳು ಬಾಕಿ ಇವೆ**! ⏳\n\n` +
        `• **ಮಾನ್ಯತೆಯ ಅಂತಿಮ ದಿನಾಂಕ:** **${formattedDate}**\n` +
        `• **ಯೋಜನೆ:** ${info.plan || "Wealthoria Premium"} (₹${info.amount || 99}/ತಿಂಗಳು)\n` +
        `• **Auto-debit:** ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ (ಮತ್ತೆ ಹಣ ಕಡಿತವಾಗುವುದಿಲ್ಲ)\n` +
        `• **ಪ್ರವೇಶ:** ಸಂಪೂರ್ಣ ಸಕ್ರಿಯ — **${formattedDate}** ರವರೆಗೆ ನೀವು ಎಲ್ಲಾ ಎಕ್ಸ್‌ಕ್ಲೂಸಿವ್ ವೀಡಿಯೊಗಳು ಮತ್ತು ಸಾಪ್ತಾಹಿಕ ಮಾರುಕಟ್ಟೆ ವರದಿಗಳನ್ನು ವೀಕ್ಷಿಸಬಹುದು.\n\n` +
        `💡 *ಮುಂದೆ ನವೀಕರಿಸಲು ಬಯಸಿದರೆ:* ನೀವು ಇದೇ ಇಮೇಲ್ ಮೂಲಕ ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಪುನಃ ಚಂದಾದಾರರಾಗಬಹುದು!`
      );
    }
    return (
      `📋 **Subscription Status: Cancelled**${nameGreeting}\n\n` +
      `You have **${daysLeft} days left** for your subscription! ⏳\n\n` +
      `• **Access valid until:** **${formattedDate}**\n` +
      `• **Plan:** ${info.plan || "Wealthoria Premium"} (₹${info.amount || 99}/month)\n` +
      `• **Auto-debit:** Cancelled (you will *not* be charged again)\n` +
      `• **Access:** Fully active — enjoy all video lessons, weekly round-ups, and member portal features until **${formattedDate}**.\n\n` +
      `💡 *Want to rejoin later?* You can easily re-subscribe anytime using the same email!`
    );
  }

  // 2. Cancelled subscription already expired
  if (info.isCancelled && (daysLeft === null || daysLeft <= 0)) {
    if (lang === "kn") {
      return (
        `📋 **ಚಂದಾದಾರಿಕೆ ಸ್ಥಿತಿ: ಅವಧಿ ಮುಗಿದಿದೆ (Expired)**${nameGreeting}\n\n` +
        `ನಿಮ್ಮ ಸದಸ್ಯತ್ವದ ಅವಧಿಯು **${formattedDate}** ರಂದು ಮುಕ್ತಾಯಗೊಂಡಿದೆ.\n\n` +
        `ಚಂದಾದಾರಿಕೆ ರದ್ದುಗೊಂಡಿದ್ದರಿಂದ ಯಾವುದೇ ಹೆಚ್ಚುವರಿ ಶುಲ್ಕ ಕಡಿತವಾಗಿಲ್ಲ.\n\n` +
        `ವೀಡಿಯೊ ಪಾಠಗಳು ಮತ್ತು ಸಾಪ್ತಾಹಿಕ ವರದಿಗಳ ಪ್ರವೇಶವನ್ನು ಪುನಃ ಪಡೆಯಲು:\n` +
        `👉 ನೀವು ಯಾವಾಗ ಬೇಕಾದರೂ **/members/subscription** ನಲ್ಲಿ ಪುನಃ ಚಂದಾದಾರರಾಗಬಹುದು!`
      );
    }
    return (
      `📋 **Subscription Status: Expired (Cancelled)**${nameGreeting}\n\n` +
      `Your membership access ended on **${formattedDate}**.\n\n` +
      `Because your subscription was cancelled, no further auto-debit payments were processed.\n\n` +
      `To regain access to video lessons and weekly round-ups:\n` +
      `👉 You can re-subscribe anytime at **/members/subscription** using your registered email!`
    );
  }

  // 3. Active subscription (auto-renewing)
  if (info.isActive) {
    const daysText = daysLeft !== null && daysLeft > 0 ? ` (ಇನ್ನೂ **${daysLeft} ದಿನಗಳು** ಬಾಕಿ)` : "";
    const daysTextEn = daysLeft !== null && daysLeft > 0 ? ` (in **${daysLeft} days**)` : "";
    if (lang === "kn") {
      return (
        `📋 **ಚಂದಾದಾರಿಕೆ ಸ್ಥಿತಿ: ಸಕ್ರಿಯವಾಗಿದೆ (Active)**${nameGreeting} 🟢\n\n` +
        `ನಿಮ್ಮ ಸದಸ್ಯತ್ವ ಸಕ್ರಿಯವಾಗಿದೆ ಮತ್ತು ಚಾಲ್ತಿಯಲ್ಲಿದೆ!\n\n` +
        `• **ಮುಂದಿನ ಬಿಲ್ಲಿಂಗ್ ದಿನಾಂಕ:** **${formattedDate}**${daysText}\n` +
        `• **ಯೋಜನೆ:** ${info.plan || "Wealthoria Premium"} (₹${info.amount || 99}/ತಿಂಗಳು)\n` +
        `• **Auto-debit:** ಸಕ್ರಿಯವಾಗಿದೆ\n\n` +
        `ನೀವು Auto-debit ರದ್ದುಗೊಳಿಸಲು ಬಯಸಿದರೆ, ನಿಮ್ಮ Member Settings ನಿಂದ ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ರದ್ದು ಮಾಡಬಹುದು.`
      );
    }
    return (
      `📋 **Subscription Status: Active**${nameGreeting} 🟢\n\n` +
      `Your subscription is active and running smoothly!\n\n` +
      `• **Next renewal date:** **${formattedDate}**${daysTextEn}\n` +
      `• **Plan:** ${info.plan || "Wealthoria Premium"} (₹${info.amount || 99}/month)\n` +
      `• **Auto-renewal:** Enabled\n\n` +
      `If you ever need to cancel auto-debit, you can do so anytime from your Member Settings.`
    );
  }

  // 4. Default / Other status
  return lang === "kn"
    ? `📋 **ಚಂದಾದಾರಿಕೆ ವಿವರಗಳು:**${nameGreeting}\n\n• **ಸ್ಥಿತಿ:** ${info.status}\n• **ದಿನಾಂಕ:** ${formattedDate}\n\nಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ನಮ್ಮ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ: support@wealthoria.in`
    : `📋 **Subscription Details:**${nameGreeting}\n\n• **Status:** ${info.status}\n• **Date:** ${formattedDate}\n\nFor more details, contact our support: support@wealthoria.in`;
}

/* ── Matching engine ─────────────────────────────────────────────────────── */
function findAnswer(query, lang) {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  let best = null;
  let bestScore = 0;

  for (const entry of KB) {
    let score = 0;
    for (const tag of entry.tags) {
      if (q.includes(tag)) {
        score += tag.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (!best || bestScore === 0) {
    return lang === "kn"
      ? "ಕ್ಷಮಿಸಿ, ನನಗೆ ಆ ವಿಷಯ ಗೊತ್ತಿಲ್ಲ. ಆದರೆ ನಮ್ಮ ತಂಡ ಸಹಾಯ ಮಾಡಬಲ್ಲರು!\n\n📧 support@wealthoria.in\n📱 +91 90197 59001"
      : "I don't have an answer for that yet — but our team can help!\n\n📧 support@wealthoria.in\n📱 +91 90197 59001";
  }

  return lang === "kn" && best.kn ? best.kn : best.en;
}

/* ── Markdown-lite renderer ─────────────────────────────────────────────── */
function RichText({ text }) {
  const lines = text.split("\n");
  return (
    <div className="wai-rich">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) => {
          if (p.startsWith("**") && p.endsWith("**")) {
            return <strong key={j}>{p.slice(2, -2)}</strong>;
          }
          const italicParts = p.split(/(\*[^*]+\*)/g).map((ip, k) => {
            if (ip.startsWith("*") && ip.endsWith("*")) {
              return <em key={k}>{ip.slice(1, -1)}</em>;
            }
            return ip;
          });
          return <React.Fragment key={j}>{italicParts}</React.Fragment>;
        });
        return <p key={i} className="wai-line">{parts}</p>;
      })}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
function WealthoriaAI({ open, onClose, lang = "en" }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [awaitingContact, setAwaitingContact] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  /* greet on open */
  useEffect(() => {
    if (open) {
      const greeting = lang === "kn" ? KB[0].kn : KB[0].en;
      setMessages([{ role: "bot", text: greeting }]);
      setShowSuggestions(true);
      setAwaitingContact(false);
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, lang]);

  /* scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ESC to close */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* prevent body scroll when open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;

    setInput("");
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: "user", text: trimmed }]);
    setIsTyping(true);

    const contact = extractContact(trimmed);
    const isSubReq = isSubscriptionQuery(trimmed);
    const hasContact = Boolean(
      contact.hasContact ||
      trimmed.includes("@") ||
      trimmed.replace(/\D/g, "").length >= 10
    );

    // 1. User is providing contact info (either requested or input has email/phone)
    if (awaitingContact || hasContact) {
      const targetContact = contact.hasContact
        ? (contact.email || contact.phone)
        : (trimmed.includes("@") ? trimmed.toLowerCase() : trimmed.replace(/\D/g, "").slice(-10) || trimmed);

      try {
        const answer = await lookupSubscriptionStatus(targetContact, lang);
        setMessages(prev => [...prev, { role: "bot", text: answer }]);
        // If not found, keep awaitingContact true so user can immediately retry with another phone/email
        if (answer.includes("couldn't find") || answer.includes("ಕಂಡುಬಂದಿಲ್ಲ")) {
          setAwaitingContact(true);
        } else {
          setAwaitingContact(false);
        }
      } catch (err) {
        setMessages(prev => [
          ...prev,
          {
            role: "bot",
            text: lang === "kn"
              ? "ಕ್ಷಮಿಸಿ, ಈ ಸಮಯದಲ್ಲಿ ಚಂದಾದಾರಿಕೆ ವಿವರಗಳನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು support@wealthoria.in ಅನ್ನು ಸಂಪರ್ಕಿಸಿ."
              : "Sorry, we could not retrieve your subscription details right now. Please reach out to support@wealthoria.in."
          }
        ]);
        setAwaitingContact(true);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // 2. User asked about subscription days/cancelled status, but didn't provide contact info yet
    if (isSubReq) {
      setAwaitingContact(true);
      setTimeout(() => {
        const promptMsg = lang === "kn"
          ? "ನಿಮ್ಮ ಚಂದಾದಾರಿಕೆಯಲ್ಲಿ ಎಷ್ಟು ದಿನಗಳು ಬಾಕಿ ಇವೆ ಎಂದು ನಾನು ತಕ್ಷಣ ಪರಿಶೀಲಿಸಬಲ್ಲೆ! 🔍\n\nದಯವಿಟ್ಟು ನೀವು ಪಾವತಿಗೆ ಬಳಸಿದ ನಿಮ್ಮ **ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸ** ಅಥವಾ **10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ**ಯನ್ನು ಟೈಪ್ ಮಾಡಿ ಕಳುಹಿಸಿ:"
          : "I can check the exact days left for your subscription! 🔍\n\nPlease enter your registered **Email ID** or **10-digit Mobile Number** (the one you used during payment/signup):";
        setMessages(prev => [...prev, { role: "bot", text: promptMsg }]);
        setIsTyping(false);
      }, 500);
      return;
    }

    // 3. Regular KB question
    const delay = 500 + Math.min(trimmed.length * 8, 500);
    setTimeout(() => {
      const answer = findAnswer(trimmed, lang);
      setMessages(prev => [...prev, { role: "bot", text: answer }]);
      setIsTyping(false);
    }, delay);
  }, [input, lang, awaitingContact]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) return null;

  const suggestions = SUGGESTIONS[lang] || SUGGESTIONS.en;

  return (
    <div className="wai-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Ask Wealthoria AI">
      <div className="wai-panel" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="wai-header">
          <div className="wai-header-left">
            <div className="wai-avatar">
              <span className="wai-avatar-icon" aria-hidden="true">🤖</span>
              <span className="wai-online-dot" aria-hidden="true" />
            </div>
            <div className="wai-header-info">
              <span className="wai-header-name">WealthBot</span>
              <span className="wai-header-sub">
                {lang === "kn" ? "Wealthoria ಕಲಿಕಾ ಸಹಾಯಕ" : "Wealthoria Learning Assistant"}
              </span>
            </div>
          </div>
          <button className="wai-close" onClick={onClose} aria-label="Close AI chat" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* ── Messages ── */}
        <div className="wai-messages" role="log" aria-live="polite">
          {messages.map((msg, i) => (
            <div key={i} className={`wai-msg wai-msg-${msg.role}`}>
              {msg.role === "bot" && (
                <div className="wai-bot-avatar" aria-hidden="true">W</div>
              )}
              <div className="wai-bubble">
                {msg.role === "bot" ? <RichText text={msg.text} /> : msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="wai-msg wai-msg-bot">
              <div className="wai-bot-avatar" aria-hidden="true">W</div>
              <div className="wai-bubble wai-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* Quick suggestions */}
          {showSuggestions && !isTyping && messages.length > 0 && (
            <div className="wai-suggestions">
              <p className="wai-suggestions-label">
                {lang === "kn" ? "ಪ್ರಶ್ನೆ ಆರಿಸಿ:" : "Quick questions:"}
              </p>
              <div className="wai-chips">
                {suggestions.map((s, i) => (
                  <button key={i} className="wai-chip" onClick={() => sendMessage(s)} type="button">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div className="wai-input-area">
          <input
            ref={inputRef}
            className="wai-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === "kn" ? "ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ…" : "Ask anything about investing…"}
            aria-label="Type your question"
            maxLength={200}
          />
          <button
            className="wai-send"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            type="button"
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22 11 13 2 9z" />
            </svg>
          </button>
        </div>

        <p className="wai-disclaimer">
          {lang === "kn"
            ? "WealthBot ಶಿಕ್ಷಣ ಮಾಹಿತಿ ಮಾತ್ರ ನೀಡುತ್ತದೆ. ಹೂಡಿಕೆ ಸಲಹೆಯಲ್ಲ."
            : "WealthBot provides financial education only — not investment advice."}
        </p>
      </div>
    </div>
  );
}

/* ── Trigger button (legacy / in-page button) ───────────────────────────── */
function WealthoriaAITrigger({ lang = "en" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="wealthoria-ai-trigger"
        className="btn wai-trigger-btn"
        onClick={() => setOpen(true)}
        type="button"
        aria-haspopup="dialog"
      >
        <span className="wai-trigger-sparkle" aria-hidden="true">✦</span>
        {lang === "kn" ? "AI ಸಹಾಯಕ ಕೇಳಿ" : "Ask WealthBot AI"}
      </button>
      <WealthoriaAI open={open} onClose={() => setOpen(false)} lang={lang} />
    </>
  );
}

/* ── Floating Round AI Button (FAB) ──────────────────────────────────────── */
function WealthoriaAIFloat({ lang = "en" }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dismissedPill, setDismissedPill] = useState(false);

  // Auto-collapse the speech pill after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setDismissedPill(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    setOpen(prev => !prev);
    setDismissedPill(true);
  };

  const showPill = !open && (!dismissedPill || hovered);

  return (
    <>
      <div
        className="wai-fab-container"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Animated Speech Bubble / Pill */}
        <div
          className={`wai-fab-pill ${showPill ? "wai-fab-pill-visible" : ""}`}
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleToggle(); }}
          aria-label="Ask WealthBot AI"
        >
          <span className="wai-fab-pill-sparkle">✦</span>
          <span className="wai-fab-pill-text">
            {lang === "kn" ? "AI ಸಹಾಯಕ ಕೇಳಿ" : "Ask WealthBot AI"}
          </span>
          <button
            type="button"
            className="wai-fab-pill-close"
            onClick={(e) => {
              e.stopPropagation();
              setDismissedPill(true);
            }}
            aria-label="Dismiss label"
          >
            ×
          </button>
        </div>

        {/* Round Floating Action Button */}
        <button
          id="wealthoria-ai-fab"
          className={`wai-fab-button ${open ? "is-open" : ""}`}
          onClick={handleToggle}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={open ? "Close WealthBot AI chat" : (lang === "kn" ? "WealthBot AI ತೆರೆಯಿರಿ" : "Open WealthBot AI Chat")}
        >
          {/* Glass glossy overlay */}
          <span className="wai-fab-gloss" aria-hidden="true" />
          {/* Bottom wave curve matching the screenshot aesthetic */}
          <span className="wai-fab-wave" aria-hidden="true" />

          {open ? (
            <svg
              className="wai-fab-close"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <div className="wai-fab-bot">
              <span className="wai-fab-icon" role="img" aria-label="AI Bot">🤖</span>
              <span className="wai-fab-ping" aria-hidden="true" />
              <span className="wai-fab-dot" aria-hidden="true" />
            </div>
          )}
        </button>
      </div>

      <WealthoriaAI open={open} onClose={() => setOpen(false)} lang={lang} />
    </>
  );
}

/* ── Window & Module exports ─────────────────────────────────────────────── */
window.WealthoriaAI = WealthoriaAI;
window.WealthoriaAITrigger = WealthoriaAITrigger;
window.WealthoriaAIFloat = WealthoriaAIFloat;

export { WealthoriaAI, WealthoriaAITrigger, WealthoriaAIFloat };
export default WealthoriaAIFloat;
