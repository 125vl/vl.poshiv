/* ============================================================
   ДАННЫЕ И ЭКОНОМИКА КАЛЬКУЛЯТОРА — правьте здесь
   ============================================================ */

window.CONFIG = {
  brand: "АвтоЧехол ДВ",
  city: "Владивосток",
  // ВНИМАНИЕ: замените на настоящие контакты
  phone: "+7 (423) 000-00-00",
  phoneRaw: "+74230000000",
  telegram: "https://t.me/your_username",
  whatsapp: "https://wa.me/74230000000",
  workHours: "ежедневно 9:00–20:00",
  address: "г. Владивосток",
  discountPercent: 10,      // скидка, действует 24 часа
  discountHours: 24,
  // Заявки на GitHub Pages: ключ Web3Forms (бесплатно, web3forms.com → письмо на вашу почту). Вставьте ключ сюда:
  web3formsKey: "",
  metrikaId: "",            // номер счётчика Яндекс.Метрики (необязательно) — включит цели воронки
  leadEndpoint: "/api/lead" // если ключа нет — собственный сервер server.js
};

/* ---------- ЭКОНОМИКА: от закупки ткани до цены, которая держит бизнес ----------
   Цена = (ткань + расходники + труд + накладные + реклама на заказ)
          × (1 + прибыль) ÷ (1 − налог).
   Один мастер шьёт сам: труд оценивается по часам. Все цифры — рыночные оценки
   для Владивостока на 2026 г., проверьте и подставьте свои. */
window.PRICING = {
  wasteFactor: 1.12,        // расход ткани = площадь чехла × 1.12 (раскрой, обрезки)
  fixedMaterials: 450,      // нитки, липучки, резинка, люверсы, молния, упаковка — на изделие, ₽
  perM2Materials: 15,       // проклейка швов, лента — ₽ за м² чехла
  hoursFixed: 1.5,          // снятие мерок/выкройка, подготовка, финиш, упаковка, ч
  hoursPerM2: 0.5,          // раскрой и пошив, ч на м² чехла
  laborRate: 500,           // ₽/ч за труд мастера (то, что вы платите себе как швее)
  overheadPct: 0.18,        // накладные от прямых затрат: аренда, свет, амортизация машин, связь
  cacPerOrder: 1000,        // реклама на одного клиента, ₽ (Яндекс.Директ / соцсети)
  taxPct: 0.06,             // налог с выручки (УСН «Доходы» 6% / самозанятый 6% с юрлиц)
  profitPct: 0.35,          // прибыль бизнеса сверх зарплаты мастера, % от затрат
  discountFloor: 1.15,      // скидка не опускает цену ниже безубыточности ×1.05
  roundTo: 50,
  minPrice: 7900,
  // сроки (рабочие дни), мастер один
  hoursPerDay: 7,           // чистых часов шитья в день
  prepDays: 2,              // закупка ткани + выкройка + согласование
  queueDays: 2,             // запас на очередь и примерку
  rushPct: 0.25,            // доплата за срочный пошив, % от цены
  rushHoursPerDay: 10       // в срочном режиме мастер работает дольше
};

/* Ткани: purchase = закупка ₽/м² (рулон, оптовая цена поставщика) */
window.FABRICS = [
  { id: "oxford", name: "Оксфорд 240D с ПУ", purchase: 170, tag: "Базовый",
    desc: "Плотная водоотталкивающая ткань. Для ежедневной защиты от дождя, пыли и птиц." },
  { id: "premium", name: "Оксфорд 300D + светоотражающий кант", purchase: 260, tag: "Хит",
    desc: "Усиленная ткань с УФ-защитой и светоотражающими вставками. Не выцветает на солнце." },
  { id: "membrane", name: "Мембранная тентовая 3 слоя", purchase: 480, tag: "Премиум",
    desc: "Дышащая мембрана: не даёт конденсату, держит снег, град и морскую соль." }
];

/* Допопции: cost — материалы, ₽; hours — доп. время мастера. rush — срочность (процент к цене) */
window.EXTRAS = [
  { id: "mirrors", name: "Карманы на зеркала", cost: 250, hours: 0.4 },
  { id: "zip", name: "Молния у двери водителя", cost: 450, hours: 0.7 },
  { id: "bag", name: "Сумка для хранения", cost: 220, hours: 0.3 },
  { id: "straps", name: "Усиленные ремни-подпруги", cost: 180, hours: 0.3 },
  { id: "fleece", name: "Мягкая подкладка на крышу и капот", cost: 700, hours: 1.2 },
  { id: "rush", name: "Срочный пошив за 2–3 дня (+25%)", rush: true }
];

/* Кузова: area — расчётная площадь ткани в м² (с припусками) */
window.BODIES = {
  hb: { name: "Хэтчбек", area: 11.0 },
  sd: { name: "Седан", area: 13.0 },
  wg: { name: "Универсал", area: 13.6 },
  cp: { name: "Купе / лифтбек", area: 11.8 },
  cr: { name: "Кроссовер", area: 14.2 },
  su: { name: "Внедорожник", area: 16.6 },
  mv: { name: "Минивэн", area: 17.6 },
  pk: { name: "Пикап", area: 17.2 },
  vn: { name: "Микроавтобус", area: 19.5 }
};

/* Марки → [модель, кузов по умолчанию, коэффициент размера (необяз.)] */
window.CARS = {
  "Toyota": [
    ["Land Cruiser 300","su",1.08],["Land Cruiser 200","su",1.08],["Land Cruiser 100/105","su",1.05],["Land Cruiser 80","su",1.02],
    ["Land Cruiser Prado 150","su"],["Land Cruiser Prado 120","su"],["Land Cruiser 70","su"],
    ["Camry","sd"],["Corolla","sd",0.97],["Corolla Fielder","wg",0.96],["Corolla Axio","sd",0.96],["Corolla Cross","cr",0.97],["Corolla Runx","hb",0.92],
    ["RAV4","cr"],["Highlander","cr",1.05],["Harrier","cr"],["C-HR","cr",0.95],["Venza","cr"],["Kluger","cr",1.05],
    ["Prius","hb",0.97],["Prius α","wg"],["Aqua","hb",0.9],["Vitz / Yaris","hb",0.88],["Passo","hb",0.86],["Auris","hb",0.95],
    ["Crown","sd",1.02],["Mark X","sd",1.02],["Mark II","sd"],["Chaser","sd"],["Cresta","sd"],["Camry Gracia","sd"],["Avensis","sd"],["Allion / Premio","sd"],["Prius PHV","hb"],
    ["Alphard","mv",1.05],["Vellfire","mv",1.05],["Noah / Voxy","mv"],["Estima","mv",1.05],["Sienta","mv",0.92],["Wish","mv",0.95],["Isis","mv",0.95],["Ipsum","mv",0.95],["Hiace","vn",1.05],["Probox / Succeed","wg",0.95],
    ["Hilux","pk"],["Tundra","pk",1.15],["Fortuner","su"],["Sequoia","su",1.15],["Hilux Surf","su"],["Rush","cr",0.95],["Ractis","hb",0.92],["Mark X ZiO","wg"]
  ],
  "Lexus": [
    ["LX 600","su",1.1],["LX 570","su",1.1],["GX 460","su",1.05],["GX 470","su",1.03],["RX","cr"],["NX","cr",0.98],["UX","cr",0.95],["LS","sd",1.07],["GS","sd"],["ES","sd"],["IS","sd",0.97],["LC","cp"],["RC","cp"]
  ],
  "Nissan": [
    ["X-Trail","cr"],["Qashqai","cr",0.97],["Juke","cr",0.92],["Murano","cr",1.03],["Patrol","su",1.1],["Pathfinder","su",1.03],["Terrano","cr",0.97],["Teana","sd"],["Almera","sd",0.97],["Sentra","sd"],["Tiida","hb",0.95],["Note","hb",0.9],["Serena","mv",1.02],["Elgrand","mv",1.05],["Leaf","hb"],["March","hb",0.86],["Skyline","sd"],["Fuga","sd",1.02],["Cube","hb",0.9],["Wingroad / AD","wg",0.95],["Sunny","sd",0.95],["Bluebird Sylphy","sd"],["Presage","mv"],["Navara","pk"],["Titan","pk",1.12],["Qashqai+2","cr",1.03],["Safari","su",1.05],["Dualis","cr",0.97]
  ],
  "Honda": [
    ["CR-V","cr"],["HR-V / Vezel","cr",0.95],["Civic","sd",0.98],["Accord","sd",1.02],["Fit / Jazz","hb",0.88],["Freed","mv",0.95],["Stepwgn","mv",1.0],["Odyssey","mv",1.02],["Pilot","cr",1.1],["Legend","sd",1.03],["Insight","hb"],["Airwave","wg",0.95],["Shuttle","wg",0.95],["Stream","mv",0.95],["N-BOX","hb",0.8],["Inspire","sd"],["Crosstour","cr"],["Elysion","mv",1.05],["Odyssey (кузов 2013+)","mv",1.02],["Grace","sd",0.97]
  ],
  "Mazda": [
    ["CX-5","cr"],["CX-9","cr",1.1],["CX-3","cr",0.92],["CX-30","cr",0.96],["CX-7","cr",1.02],["Mazda3","sd",0.97],["Mazda3 Sport","hb",0.95],["Mazda6","sd",1.02],["Demio","hb",0.9],["Axela","hb",0.95],["Atenza","sd"],["MPV","mv",1.0],["Premacy","mv",0.95],["BT-50","pk"],["Familia","wg",0.95],["Bongo","vn",0.95],["RX-8","cp"],["MX-5","cp",0.85],["Tribute","cr"]
  ],
  "Subaru": [
    ["Forester","cr"],["Outback","wg",1.02],["Legacy","sd"],["Impreza","sd",0.97],["Impreza Sport","hb",0.95],["XV / Crosstrek","cr",0.97],["Levorg","wg"],["WRX","sd"],["Tribeca","cr",1.05],["Exiga","mv",0.98],["Ascent","cr",1.1],["BRZ","cp",0.9],["Legacy Lancaster","wg"],["Trezia","hb",0.92]
  ],
  "Mitsubishi": [
    ["Outlander","cr"],["Pajero","su"],["Pajero Sport","su"],["Pajero Mini","hb",0.82],["L200","pk"],["ASX","cr",0.96],["Lancer","sd",0.97],["Lancer X","sd",0.97],["Delica","vn",0.97],["Delica D:5","mv"],["Colt","hb",0.9],["Galant","sd"],["Eclipse Cross","cr"],["Grandis","mv"],["Montero Sport","su"],["Airtrek","cr"],["Chariot Grandis","mv"],["Mirage","hb",0.88]
  ],
  "Suzuki": [
    ["Jimny","su",0.82],["Jimny Sierra","su",0.84],["Escudo / Vitara","cr",0.97],["Grand Vitara","cr"],["SX4","cr",0.92],["Swift","hb",0.88],["Solio","hb",0.9],["Wagon R","hb",0.82],["Hustler","hb",0.82],["Spacia","hb",0.84],["Xbee","cr",0.9],["Every","vn",0.78],["Alto","hb",0.8],["Ignis","hb",0.85],["Baleno","hb",0.92],["Ertiga","mv",0.98],["Liana","hb"]
  ],
  "Daihatsu": [
    ["Rocky","cr",0.9],["Terios","cr",0.9],["Tanto","hb",0.82],["Move","hb",0.82],["Mira","hb",0.8],["Copen","cp",0.75],["Hijet","vn",0.8],["Taft","cr",0.84],["Thor","mv",0.9],["Boon","hb",0.86],["Cast","hb",0.82],["Wake","hb",0.82]
  ],
  "Isuzu": [["D-Max","pk"],["MU-X","su"],["Bighorn","su"],["Elf","vn",1.1],["Wizard","su"]],
  "Hyundai": [
    ["Solaris","sd",0.97],["Solaris хэтчбек","hb",0.94],["Elantra","sd"],["Sonata","sd",1.02],["Creta","cr",0.97],["Tucson","cr"],["Santa Fe","cr",1.05],["Palisade","su",1.08],["Grandeur / Azera","sd",1.05],["i30","hb",0.97],["i40","wg"],["Accent","sd",0.96],["Genesis","sd",1.03],["Getz","hb",0.88],["Matrix","mv",0.92],["Starex / H-1","vn",1.0],["Porter","vn",0.95],["Staria","mv",1.1],["Kona","cr",0.95],["Venue","cr",0.92],["Veloster","cp"],["ix35","cr"],["ix55 / Veracruz","cr",1.05],["Equus","sd",1.08],["Santa Fe Classic","cr"],["Trajet","mv"],["Avante","sd"]
  ],
  "Kia": [
    ["Rio","sd",0.96],["Rio X","cr",0.96],["Rio хэтчбек","hb",0.92],["Ceed","hb",0.97],["Ceed SW","wg"],["Cerato","sd"],["K5 / Optima","sd",1.02],["K7 / Cadenza","sd",1.04],["K8","sd",1.05],["Sportage","cr"],["Sorento","cr",1.05],["Seltos","cr",0.97],["Mohave / Borrego","su",1.05],["Carnival","mv",1.08],["Stinger","cp",1.02],["Soul","hb",0.97],["Picanto","hb",0.85],["Morning","hb",0.85],["Ray","hb",0.84],["Niro","cr",0.97],["Sportage 4","cr"],["Stonic","cr",0.93],["Carens","mv"],["Bongo","vn",1.0],["K3","sd"],["Telluride","su",1.08],["EV6","cr"],["K900","sd",1.07]
  ],
  "Genesis": [["G70","sd",0.98],["G80","sd",1.03],["G90","sd",1.08],["GV60","cr"],["GV70","cr"],["GV80","su",1.05]],
  "SsangYong": [["Actyon","cr"],["Actyon Sports","pk"],["Kyron","cr"],["Rexton","su"],["Musso","pk"],["Korando","cr"],["Tivoli","cr",0.95],["Rodius","mv",1.05],["Torres","cr"],["Istana","vn"]],
  "Daewoo / Chevrolet (Корея)": [["Nexia","sd",0.95],["Matiz","hb",0.82],["Lanos","sd",0.97],["Gentra","sd"],["Lacetti","sd"],["Winstorm","cr",1.02]],
  "Chevrolet": [["Cruze","sd"],["Aveo","sd",0.96],["Lacetti","sd"],["Spark","hb",0.84],["Cobalt","sd"],["Captiva","cr",1.03],["Trailblazer","su",1.05],["Tahoe","su",1.15],["Suburban","su",1.2],["Niva","cr",0.95],["Orlando","mv",1.0],["Equinox","cr"],["Malibu","sd",1.02],["Camaro","cp"],["Silverado","pk",1.12],["Colorado","pk"],["Tracker","cr",0.95],["Blazer","su",1.0],["Traverse","su",1.1],["Express","vn",1.1]],
  "Ford": [["Focus","hb",0.98],["Focus седан","sd"],["Mondeo","sd",1.02],["Fiesta","hb",0.9],["Kuga","cr"],["EcoSport","cr",0.93],["Explorer","su",1.08],["Edge","cr",1.05],["Expedition","su",1.2],["F-150","pk",1.15],["Ranger","pk"],["Transit","vn",1.1],["Transit Custom","vn"],["Mustang","cp"],["Galaxy","mv"],["S-Max","mv"],["C-Max","mv",0.95],["Fusion","sd"],["Escape","cr"],["Bronco","su"],["Maverick","pk",0.95],["Tourneo","vn",0.95],["Puma","cr",0.93],["Mustang Mach-E","cr"]],
  "Volkswagen": [["Polo","sd",0.96],["Polo хэтчбек","hb",0.9],["Golf","hb",0.97],["Passat","sd",1.02],["Passat Variant","wg",1.02],["Jetta","sd"],["Tiguan","cr"],["Touareg","su",1.05],["Teramont / Atlas","cr",1.12],["Caddy","vn",0.9],["Transporter / T5 / T6","vn"],["Multivan","mv",1.05],["Sharan","mv"],["Touran","mv"],["Amarok","pk"],["T-Roc","cr",0.95],["Taos","cr"],["Arteon","cp",1.03],["Scirocco","cp",0.95],["Beetle","hb",0.9],["ID.4","cr"],["Up!","hb",0.82],["Crafter","vn",1.2],["Bora","sd"],["Lupo","hb",0.8]],
  "Skoda": [["Octavia","hb",1.0],["Octavia Combi","wg"],["Rapid","hb",0.96],["Rapid седан","sd"],["Superb","sd",1.05],["Superb Combi","wg",1.05],["Kodiaq","cr",1.03],["Karoq","cr",0.97],["Kamiq","cr",0.93],["Fabia","hb",0.9],["Yeti","cr",0.96],["Enyaq","cr"],["Roomster","mv",0.92],["Scala","hb"]],
  "Audi": [["A3","hb",0.95],["A3 седан","sd",0.97],["A4","sd"],["A4 Avant","wg"],["A5","cp"],["A6","sd",1.03],["A6 Avant","wg",1.03],["A7","cp",1.04],["A8","sd",1.08],["Q2","cr",0.92],["Q3","cr",0.97],["Q5","cr"],["Q7","su",1.08],["Q8","cr",1.08],["TT","cp",0.88],["e-tron","cr",1.03],["A1","hb",0.88],["R8","cp",0.9],["Allroad","wg",1.05],["RS6","wg",1.05],["RS Q8","cr",1.08]],
  "BMW": [["1 Series","hb",0.95],["2 Series","cp"],["3 Series","sd"],["3 Series Touring","wg"],["4 Series","cp"],["5 Series","sd",1.03],["5 Series Touring","wg",1.03],["6 Series GT","cp",1.05],["7 Series","sd",1.1],["8 Series","cp",1.03],["X1","cr",0.97],["X2","cr",0.96],["X3","cr"],["X4","cr",1.0],["X5","su",1.06],["X6","cr",1.08],["X7","su",1.14],["Z4","cp",0.85],["i3","hb",0.88],["i4","cp",1.02],["iX","cr",1.06],["M5","sd",1.05],["X5 M","su",1.06],["X3 M","cr"]],
  "Mercedes-Benz": [["A-Class","hb",0.96],["A-Class седан","sd",0.97],["B-Class","hb",1.0],["C-Class","sd"],["C-Class Estate","wg"],["CLA","cp"],["CLS","cp",1.04],["E-Class","sd",1.04],["E-Class Estate","wg",1.04],["S-Class","sd",1.1],["GLA","cr",0.96],["GLB","cr",1.0],["GLC","cr"],["GLC Coupe","cr"],["GLE","su",1.06],["GLE Coupe","cr",1.06],["GLS","su",1.15],["G-Class","su",1.04],["V-Class","mv",1.1],["Vito","vn",1.05],["Sprinter","vn",1.2],["ML","su",1.04],["GL","su",1.1],["X-Class","pk",1.05],["AMG GT","cp",0.98],["SLK / SLC","cp",0.86],["Maybach S","sd",1.14],["EQC","cr"],["EQS","cp",1.08]],
  "Opel": [["Astra","hb",0.97],["Astra седан","sd"],["Corsa","hb",0.9],["Insignia","sd",1.02],["Mokka","cr",0.95],["Zafira","mv"],["Vectra","sd"],["Meriva","mv",0.95],["Antara","cr"],["Vivaro","vn"],["Grandland","cr"],["Crossland","cr",0.96]],
  "Volvo": [["XC40","cr",0.96],["XC60","cr"],["XC90","su",1.08],["S60","sd"],["S80","sd",1.03],["S90","sd",1.06],["V40","hb",0.95],["V60","wg"],["V90","wg",1.06],["C30","hb",0.9],["XC70","wg",1.03]],
  "Land Rover": [["Range Rover","su",1.12],["Range Rover Sport","su",1.07],["Range Rover Velar","cr",1.02],["Range Rover Evoque","cr",0.96],["Discovery","su",1.08],["Discovery Sport","cr"],["Defender 90","su",0.96],["Defender 110","su",1.08],["Freelander","cr",0.98]],
  "Porsche": [["Cayenne","su",1.04],["Macan","cr",0.97],["Panamera","cp",1.06],["911","cp",0.92],["Taycan","cp",1.0],["718 Cayman/Boxster","cp",0.88]],
  "Jaguar": [["XF","sd",1.02],["XE","sd"],["XJ","sd",1.08],["F-Pace","cr",1.03],["E-Pace","cr",0.96],["F-Type","cp",0.9],["I-Pace","cr"]],
  "Peugeot": [["208","hb",0.9],["308","hb",0.97],["408","sd"],["508","sd",1.02],["2008","cr",0.94],["3008","cr"],["5008","cr",1.05],["Partner","vn",0.9],["Boxer","vn",1.15],["Expert","vn"],["Traveller","mv",1.05],["407","sd"],["301","sd",0.96]],
  "Citroen": [["C3","hb",0.9],["C4","hb",0.97],["C4 Picasso","mv"],["C5 Aircross","cr"],["C5","sd",1.03],["C-Elysee","sd",0.96],["Berlingo","vn",0.92],["Jumpy","vn"],["Jumper","vn",1.15],["DS4","hb"]],
  "Renault": [["Logan","sd",0.97],["Sandero","hb",0.93],["Sandero Stepway","cr",0.94],["Duster","cr",0.97],["Kaptur","cr",0.95],["Arkana","cr",0.98],["Megane","hb",0.97],["Fluence","sd"],["Captur","cr",0.94],["Koleos","cr",1.02],["Clio","hb",0.88],["Scenic","mv"],["Kangoo","vn",0.92],["Trafic","vn"],["Master","vn",1.15],["Laguna","sd"],["Symbol","sd",0.96],["Dokker","vn",0.93]],
  "Fiat": [["500","hb",0.78],["Panda","hb",0.82],["Doblo","vn",0.95],["Ducato","vn",1.15],["Fiorino","vn",0.88],["Tipo","sd"],["Punto","hb",0.9],["Albea","sd",0.96]],
  "Alfa Romeo": [["Giulia","sd"],["Stelvio","cr"],["Giulietta","hb",0.97],["159","sd"],["MiTo","hb",0.88]],
  "Mini": [["Cooper","hb",0.84],["Countryman","cr",0.97],["Clubman","wg",0.95],["Cooper 5-door","hb",0.88],["Paceman","cr",0.92]],
  "Infiniti": [["QX50","cr"],["QX60","cr",1.05],["QX70 / FX","cr",1.02],["QX80","su",1.12],["Q50","sd"],["Q60","cp"],["Q70 / M","sd",1.03],["JX35","cr",1.05],["EX","cr",0.97],["G","sd"]],
  "Acura": [["MDX","cr",1.05],["RDX","cr"],["TLX","sd"],["ZDX","cr"],["RL","sd",1.03]],
  "Cadillac": [["Escalade","su",1.2],["XT5","cr"],["XT4","cr",0.97],["XT6","cr",1.08],["CTS","sd"],["ATS","sd",0.97],["SRX","cr"],["CT6","sd",1.07]],
  "Lincoln": [["Navigator","su",1.2],["Aviator","su",1.08],["MKZ","sd"],["Continental","sd",1.06]],
  "Jeep": [["Wrangler","su",0.97],["Wrangler Unlimited","su",1.05],["Grand Cherokee","su",1.02],["Cherokee","cr"],["Compass","cr",0.96],["Renegade","cr",0.92],["Gladiator","pk"],["Commander","su",1.08]],
  "Dodge / Chrysler / RAM": [["Ram 1500","pk",1.15],["Challenger","cp",1.04],["Charger","sd",1.04],["Durango","su",1.08],["Caravan / Grand Caravan","mv",1.1],["Journey","cr"],["Chrysler 300C","sd",1.04],["Pacifica","mv",1.1],["Voyager","mv",1.08]],
  "Tesla": [["Model 3","sd"],["Model S","cp",1.05],["Model X","cr",1.07],["Model Y","cr"],["Cybertruck","pk",1.1]],
  "Buick": [["Envision","cr"],["Encore","cr",0.95],["Enclave","cr",1.1],["LaCrosse","sd",1.03],["GL8","mv",1.1]],
  "Lada (ВАЗ)": [["Granta","sd",0.96],["Granta лифтбек","cp",0.96],["Granta универсал","wg",0.96],["Vesta","sd"],["Vesta SW","wg"],["Vesta SW Cross","wg"],["Largus","wg",1.0],["Largus фургон","vn",0.95],["XRAY","hb",0.95],["Niva Legend (2121)","su",0.88],["Niva Travel","cr",0.97],["Kalina","hb",0.9],["Priora","sd",0.97],["2101–2107","sd",0.94],["2108–2115","hb",0.9],["Samara","hb",0.9],["Aura","sd",1.0]],
  "УАЗ": [["Patriot","su"],["Hunter","su",0.97],["Буханка","vn",1.0],["Pickup","pk"],["Профи","pk",1.05]],
  "ГАЗ": [["Газель Next","vn",1.1],["Газель (3302)","vn",1.1],["Соболь","vn",1.0],["Волга 3110","sd",1.0],["Волга 31105","sd",1.0],["Садко","su",1.2]],
  "Moskvich / Москвич": [["Москвич 3","cr",0.97],["Москвич 6","sd"]],
  "Chery": [["Tiggo 4","cr",0.95],["Tiggo 7 Pro","cr"],["Tiggo 8","cr",1.04],["Tiggo 8 Pro Max","cr",1.05],["Arrizo 8","sd"],["Arrizo 6","sd",0.97],["Omoda C5","cr"],["Omoda S5","sd"],["Tiggo 5","cr"],["Amulet","sd",0.95],["QQ","hb",0.8],["Exeed TXL","cr",1.04],["Exeed LX","cr"],["Exeed VX","cr",1.06],["Jaecoo J7","cr"],["Jaecoo J8","cr",1.04]],
  "Haval": [["Jolion","cr",0.97],["F7","cr"],["F7x","cr"],["H6","cr"],["H9","su",1.05],["Dargo","cr",1.02],["M6","cr",0.97],["H3","cr"],["H5","pk"],["Big Dog","cr"],["Haval H4","cr"],["Haval F5","cr"],["Haval Monster","cr"]],
  "Geely": [["Coolray","cr",0.96],["Atlas","cr"],["Atlas Pro","cr"],["Monjaro","cr",1.06],["Tugella","cr",1.0],["Emgrand","sd"],["Emgrand 7","sd"],["Preface","sd",1.02],["Okavango","mv",1.05],["Geometry C","cr"],["Azkarra","cr"],["Starray","cr"],["Cityray","cr",0.97],["Belgee X70","cr"],["MK","sd",0.95],["Vision","sd",0.95]],
  "Changan": [["CS35 Plus","cr",0.96],["CS55 Plus","cr"],["CS75 Plus","cr",1.02],["CS85","cr",1.03],["UNI-K","cr",1.04],["UNI-T","cr"],["UNI-V","cp"],["Eado","sd"],["Alsvin","sd",0.97],["Hunter Plus","pk",1.0],["Lamore","cr"],["Deepal S7","cr"],["Deepal L07","sd"]],
  "Exeed / Omoda / Jaecoo": [["Exeed TXL","cr",1.04],["Exeed LX","cr"],["Exeed VX","cr",1.06],["Exeed RX","cr",1.03],["Omoda C5","cr"],["Omoda S5","sd"],["Omoda C9","cr",1.05],["Jaecoo J7","cr"],["Jaecoo J8","cr",1.04]],
  "Great Wall": [["Wingle 5","pk"],["Wingle 7","pk"],["Poer","pk",1.05],["Hover H3","cr"],["Hover H5","cr"],["Safe","su"],["Voleex","hb"]],
  "Tank": [["Tank 300","su",1.0],["Tank 500","su",1.1],["Tank 700","su",1.12],["Tank 400","su",1.05]],
  "BYD": [["Song Plus","cr"],["Song Plus Champion","cr"],["Han","sd",1.03],["Tang","cr",1.06],["Seal","sd",1.0],["Dolphin","hb",0.92],["Atto 3","cr",0.97],["Qin Plus","sd"],["Yuan Plus","cr"],["Chazor","sd"],["F3","sd",0.96],["Seagull","hb",0.88],["Seal U","cr"],["Destroyer 05","sd"],["Sealion 07","cr"],["Han L","sd",1.03]],
  "Zeekr": [["001","wg",1.02],["007","sd",1.0],["X","cr",0.95],["009","mv",1.1],["7X","cr"]],
  "Li Auto": [["L6","cr"],["L7","cr",1.05],["L8","cr",1.07],["L9","cr",1.1],["Mega","mv",1.1],["i8","cr"]],
  "NIO / Xpeng / Voyah": [["NIO ES6","cr"],["NIO ES8","cr",1.07],["NIO ET5","sd"],["Xpeng G6","cr"],["Xpeng P7","sd"],["Voyah Free","cr"],["Voyah Dreamer","mv",1.08],["Voyah Passion","sd",1.03]],
  "JAC": [["S3","cr",0.95],["S5","cr"],["JS4","cr",0.97],["J7","sd"],["T6","pk"],["T8","pk"],["Sunray","vn"],["Refine","mv"]],
  "FAW / Hongqi": [["Bestune T77","cr"],["Bestune B70","sd"],["Hongqi H5","sd"],["Hongqi H9","sd",1.07],["Hongqi HS5","cr"],["Hongqi E-HS9","su",1.1],["Besturn X80","cr"]],
  "Dongfeng / Forthing / DFM": [["Forthing T5","cr"],["Forthing U-Tour","mv",1.05],["DFM 580","cr"],["DFM AX7","cr"],["Aeolus","sd"]],
  "Lifan / Brilliance / DongFeng старые": [["Solano","sd",0.97],["X60","cr"],["Myway","cr"],["Breez","sd",0.95],["Smily","hb",0.88],["M2","sd"],["H530","sd"]],
  "Lynk & Co / Baic / Wey": [["Lynk&Co 01","cr"],["Lynk&Co 09","cr",1.06],["BAIC X7","cr"],["BAIC BJ40","su"],["BAIC U5","sd"],["Wey Coffee 01","su",1.05]],
  "Другие китайские": [["Kaiyi X3","cr"],["Kaiyi E5","sd"],["Livan X3","cr"],["Jetour X70","cr"],["Jetour X90","cr",1.05],["Jetour Dashing","cr"],["Dayun","cr"],["Foton","vn",1.1],["Hozon / Neta","cr"],["Seres","cr"]],
  "Другая марка / не нашёл": [["Свой вариант (укажите в комментарии)","cr"]]
};

window.OTHER_BRAND = "Другая марка / не нашёл";

/* Русские названия для поиска (клиент может писать «тойота», «бмв» и т.п.) */
window.BRAND_ALIASES = {
  "Toyota": "тойота тоета", "Lexus": "лексус", "Nissan": "ниссан", "Honda": "хонда", "Mazda": "мазда", "Subaru": "субару",
  "Mitsubishi": "митсубиси мицубиси", "Suzuki": "сузуки судзуки", "Daihatsu": "дайхатсу", "Isuzu": "исузу",
  "Hyundai": "хендай хёндэ хундай", "Kia": "киа", "Genesis": "генезис дженезис", "SsangYong": "ссангйонг саньенг сангенг",
  "Chevrolet": "шевроле", "Ford": "форд", "Volkswagen": "фольксваген вв", "Skoda": "шкода", "Audi": "ауди", "BMW": "бмв бэмве",
  "Mercedes-Benz": "мерседес мерин мерс", "Opel": "опель", "Volvo": "вольво", "Land Rover": "ленд ровер рендж ровер", "Porsche": "порше",
  "Jaguar": "ягуар", "Peugeot": "пежо", "Citroen": "ситроен", "Renault": "рено", "Fiat": "фиат", "Alfa Romeo": "альфа ромео",
  "Mini": "мини", "Infiniti": "инфинити", "Acura": "акура", "Cadillac": "кадиллак", "Lincoln": "линкольн", "Jeep": "джип",
  "Dodge / Chrysler / RAM": "додж крайслер рам", "Tesla": "тесла", "Buick": "бьюик", "Lada (ВАЗ)": "лада ваз жигули", "УАЗ": "уаз",
  "ГАЗ": "газ газель волга", "Moskvich / Москвич": "москвич", "Chery": "чери", "Haval": "хавал хавейл", "Geely": "джили гили",
  "Changan": "чанган", "Exeed / Omoda / Jaecoo": "эксид омода жаку", "Great Wall": "грейт волл", "Tank": "танк", "BYD": "бид бйд",
  "Zeekr": "зикр зеекр", "Li Auto": "ли авто лиавто", "NIO / Xpeng / Voyah": "нио хпенг вояч", "JAC": "джак", "FAW / Hongqi": "фав хунци",
  "Daewoo / Chevrolet (Корея)": "дэу дэво", "Dongfeng / Forthing / DFM": "донфенг фортинг", "Lynk & Co / Baic / Wey": "линк бейк вей",
  "Другие китайские": "китайские китаец", "Другая марка / не нашёл": "другая не нашел"
};

/* Русские названия моделей для поиска: ключ — начало названия модели */
window.MODEL_ALIASES = {
  "Land Cruiser Prado": "прадо ленд крузер прадо", "Land Cruiser": "ленд крузер крузак ланд круизер", "Camry": "камри", "Corolla": "королла корола",
  "RAV4": "рав4 рав 4 рав", "Highlander": "хайлендер", "Harrier": "харриер хариер", "Alphard": "альфард", "Vellfire": "вельфайр", "Noah": "ноах ноа",
  "Voxy": "вокси", "Crown": "краун", "Prius": "приус", "Hilux": "хайлюкс хайлакс", "Aqua": "аква", "Vitz": "витц ярис", "Passo": "пассо", "Mark X": "марк икс марк 10",
  "Sienta": "сиента", "Estima": "эстима", "Hiace": "хайс хайэйс", "C-HR": "чр", "Tundra": "тундра", "Fortuner": "фортунер",
  "X-Trail": "х-трейл икстрейл хтрейл", "Qashqai": "кашкай", "Juke": "жук джук", "Murano": "мурано", "Patrol": "патрол", "Teana": "теана", "Note": "ноут", "Serena": "серена", "Elgrand": "элгранд",
  "CR-V": "црв срв", "Civic": "цивик", "Accord": "аккорд", "Fit": "фит", "HR-V": "хрв везел", "Freed": "фрид", "Odyssey": "одиссей", "Stepwgn": "степвагон", "Pilot": "пилот",
  "CX-5": "сх5 цх5", "CX-9": "сх9", "Mazda3": "мазда 3", "Mazda6": "мазда 6", "Demio": "демио", "Axela": "аксела",
  "Forester": "форестер", "Outback": "аутбек", "Impreza": "импреза", "Legacy": "легаси", "XV": "хв", "Levorg": "леворг",
  "Outlander": "аутлендер", "Pajero": "паджеро", "Lancer": "лансер", "Delica": "делика", "ASX": "асх",
  "Solaris": "солярис", "Creta": "крета", "Tucson": "туксон тусан", "Santa Fe": "санта фе", "Elantra": "элантра", "Sonata": "соната", "Palisade": "палисейд",
  "Sportage": "спортейдж спортаж", "Rio": "рио", "Sorento": "соренто", "Ceed": "сид", "Cerato": "церато", "Optima": "оптима", "Seltos": "селтос", "Carnival": "карнивал",
  "Polo": "поло", "Tiguan": "тигуан", "Passat": "пассат", "Golf": "гольф", "Touareg": "туарег", "Jetta": "джетта", "Teramont": "терамонт",
  "Octavia": "октавия", "Rapid": "рапид", "Superb": "суперб", "Kodiaq": "кодиак", "Karoq": "карок",
  "Focus": "фокус", "Mondeo": "мондео", "Kuga": "куга", "Fiesta": "фиеста", "Explorer": "эксплорер", "Transit": "транзит",
  "Cruze": "круз", "Aveo": "авео", "Lacetti": "лачетти", "Captiva": "каптива", "Tahoe": "тахо", "Niva": "нива",
  "Duster": "дастер", "Logan": "логан", "Sandero": "сандеро", "Kaptur": "каптур", "Arkana": "аркана", "Megane": "меган",
  "Granta": "гранта", "Vesta": "веста", "Largus": "ларгус", "Kalina": "калина", "Priora": "приора", "XRAY": "хрей икс рей",
  "Patriot": "патриот", "Hunter": "хантер", "Буханка": "буханка таблетка",
  "Jimny": "джимни", "Escudo": "эскудо", "Swift": "свифт", "Every": "эвери",
  "X-Class": "х класс", "G-Class": "гелик гелендваген джи класс", "C-Class": "ц класс цешка", "E-Class": "е класс", "S-Class": "с класс", "GLE": "глк гле", "GLC": "глц глк", "GLS": "глс",
  "3 Series": "тройка 3 серии", "5 Series": "пятёрка пятерка 5 серии", "7 Series": "семерка семёрка 7 серии", "X5": "икс5 х5", "X6": "икс6 х6", "X3": "икс3 х3", "X7": "икс7 х7",
  "Q5": "ку5", "Q7": "ку7", "A4": "а4", "A6": "а6", "Cayenne": "кайен", "Macan": "макан", "Model 3": "модель 3", "Model Y": "модель у",
  "Tiggo": "тигго", "Jolion": "джолион", "Coolray": "кулрей", "Atlas": "атлас", "Monjaro": "монжаро", "Song": "сонг", "Han": "хан"
};
