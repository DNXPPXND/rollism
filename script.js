// ==========================================
// SUKI ROLL DAILY TRACKER
// ==========================================

// ราคามาตรฐานต่อกล่อง
const PRICE_PER_BOX = 55;


// ==========================================
// INGREDIENT CONFIGURATION
// ==========================================

const INGREDIENT_GROUPS = [
    {
        category: "สุกี้โรล",
        items: [
            { name: "ผักกาด", unit: "โล" },
            { name: "หมูบด", unit: "โล" },
            { name: "หมูเด้ง", unit: "ถุง" },
            { name: "วุ้นเส้น", unit: "ถุง" },
            { name: "แครอท", unit: "หัว" },
            { name: "รากผักชี", unit: "กำ" },
            { name: "กระเทียม", unit: "ถุง" },
            { name: "พริกไทย", unit: "ถุง" },
            { name: "ไข่", unit: "แผง" },
            { name: "ซอสหอยนางรม", unit: "แกลอน" },
            { name: "ซอสฝาเขียว", unit: "ขวด" },
            { name: "ซีอิ้วขาว", unit: "ขวด" },
            { name: "ขึ้นฉ่าย", unit: "กำ" },
            { name: "แป้ง", unit: "ถุง" }
        ]
    },

    {
        category: "น้ำจิ้ม",
        items: [
            {
                name: "พริก",
                unit: "ถุง"
            },
            {
                name: "กระเทียม (น้ำจิ้ม)",
                nameDisplay: "กระเทียม",
                unit: "ถุง"
            },
            {
                name: "น้ำส้มสายชู",
                unit: "ขวด"
            },
            {
                name: "น้ำกระเทียมดอง",
                unit: "ขวด"
            },
            {
                name: "เต้าหู้ยี้",
                unit: "โถ"
            },
            {
                name: "ซอสมะเขือเทศ",
                unit: "ถุง"
            },
            {
                name: "ซอสพริก",
                unit: "แกลอน"
            },
            {
                name: "งา",
                unit: "ถุง"
            },
            {
                name: "น้ำตาล",
                unit: "ถุง"
            },
            {
                name: "น้ำมันงา",
                unit: "ขวด"
            },
            {
                name: "ผงหม่าล่า",
                unit: "ถุง"
            },
            {
                name: "น้ำจิ้มงา",
                unit: "ถุง"
            }
        ]
    },

    {
        category: "อื่นๆ",
        items: [
            {
                name: "ขายได้",
                unit: "กล่อง",
                defaultPrice: PRICE_PER_BOX
            },
            {
                name: "กล่อง",
                unit: "แพ็ค"
            },
            {
                name: "ถุง",
                unit: "แพ็ค"
            },
            {
                name: "น้ำแข็ง",
                unit: "ถุง"
            },
            {
                name: "ค่าที่ขายของ",
                unit: "วัน"
            },
            {
                name: "แก๊ส",
                unit: "ถัง"
            },
            {
                name: "ถุงมือ",
                unit: "แพ็ค"
            },
            {
                name: "ถ้วยน้ำจิ้ม",
                unit: "แพ็ค"
            },
            {
                name: "ตะเกียบ",
                unit: "แพ็ค"
            }
        ]
    }
];


// ==========================================
// ITEM LOOKUP
// ==========================================

const itemLookup = {};

INGREDIENT_GROUPS.forEach(group => {

    group.items.forEach(item => {

        itemLookup[item.name] = {
            ...item,
            category: group.category
        };

    });

});


// ==========================================
// LOCAL STORAGE
// ==========================================

let allLogs = {};

try {

    allLogs = JSON.parse(
        localStorage.getItem("suki_roll_logs_v3") ||
        localStorage.getItem("suki_roll_logs_v2") ||
        localStorage.getItem("suki_roll_logs") ||
        "{}"
    );

} catch (error) {

    console.error(
        "ไม่สามารถอ่านข้อมูล LocalStorage:",
        error
    );

    allLogs = {};
}


// ==========================================
// GLOBAL STATES
// ==========================================

let currentRows = [];

let gasUrl =
    localStorage.getItem(
        "suki_roll_gas_url"
    ) || "";

let trendChartInstance = null;

let boxesChartInstance = null;


// ==========================================
// DATE HELPER
// ==========================================

// สำคัญมาก:
// ห้ามใช้ new Date().toISOString()
// เพื่อเอาวันที่ในไทย เพราะอาจเหลื่อมวัน
function getLocalDateString(date = new Date()) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const today =
            getLocalDateString();

        const dateInput =
            document.getElementById(
                "recordDate"
            );

        const gasInput =
            document.getElementById(
                "gasUrlInput"
            );

        if (dateInput) {
            dateInput.value = today;

            dateInput.addEventListener(
                "change",
                event => {

                    loadDateData(
                        event.target.value
                    );

                }
            );
        }

        if (gasInput) {
            gasInput.value = gasUrl;
        }

        loadDateData(today);

        renderHistoryTable();

        if (
            typeof lucide !== "undefined"
        ) {
            lucide.createIcons();
        }

        // ถ้ามี GAS URL
        // ลองดึงข้อมูลจาก Google Sheets
        if (gasUrl) {

            await loadDataFromGoogleSheets(
                false
            );

        }
    }
);


// ==========================================
// TAB SWITCH
// ==========================================

function switchTab(tabName) {

    document
        .querySelectorAll(".tab-btn")
        .forEach(btn => {

            btn.classList.remove(
                "bg-emerald-600",
                "text-white",
                "shadow-sm"
            );

            btn.classList.add(
                "text-slate-300"
            );

        });

    const activeTab =
        document.getElementById(
            `tab-${tabName}`
        );

    if (activeTab) {

        activeTab.classList.add(
            "bg-emerald-600",
            "text-white",
            "shadow-sm"
        );

        activeTab.classList.remove(
            "text-slate-300"
        );
    }


    document
        .getElementById("section-entry")
        ?.classList.add("hidden");

    document
        .getElementById("section-analytics")
        ?.classList.add("hidden");

    document
        .getElementById("section-settings")
        ?.classList.add("hidden");


    document
        .getElementById(
            `section-${tabName}`
        )
        ?.classList.remove("hidden");


    if (tabName === "analytics") {

        renderAnalyticsCharts();

    }
}


// ==========================================
// DRAFT
// ==========================================

function saveDraft() {

    const dateStr =
        document.getElementById(
            "recordDate"
        )?.value;

    if (!dateStr) {
        return;
    }

    localStorage.setItem(
        `suki_draft_${dateStr}`,
        JSON.stringify(currentRows)
    );
}


// ==========================================
// LOAD DATE
// ==========================================

function loadDateData(dateStr) {

    if (!dateStr) {
        return;
    }

    const draft =
        localStorage.getItem(
            `suki_draft_${dateStr}`
        );


    if (
        allLogs[dateStr] &&
        Array.isArray(
            allLogs[dateStr].items
        )
    ) {

        currentRows =
            JSON.parse(
                JSON.stringify(
                    allLogs[dateStr].items
                )
            );

    } else if (draft) {

        try {

            currentRows =
                JSON.parse(draft);

        } catch (error) {

            currentRows = [
                {
                    itemName: "ขายได้",
                    qty: 0,
                    price: 0
                }
            ];

        }

    } else {

        currentRows = [
            {
                itemName: "ขายได้",
                qty: 0,
                price: 0
            }
        ];
    }


    renderTableRows();

    calculateTotals();
}


// ==========================================
// LOAD LAST TEMPLATE
// ==========================================

function loadLastTemplate() {

    const sortedDates =
        Object.keys(allLogs)
            .sort()
            .reverse();


    if (
        sortedDates.length === 0
    ) {

        alert(
            "ยังไม่มีประวัติการบันทึกก่อนหน้าให้ดึงข้อมูล"
        );

        return;
    }


    const lastDate =
        sortedDates[0];

    const lastItems =
        allLogs[lastDate]?.items || [];


    if (
        lastItems.length === 0
    ) {

        return;
    }


    if (
        confirm(
            `ต้องการดึงรายการวัตถุดิบจากวันที่ ${lastDate} ใช่หรือไม่?\n\nจำนวนและราคารวมจะถูกล้างเพื่อให้กรอกใหม่`
        )
    ) {

        currentRows =
            lastItems.map(item => ({

                itemName:
                    item.itemName,

                category:
                    item.category ||
                    itemLookup[
                        item.itemName
                    ]?.category ||
                    "อื่นๆ",

                unit:
                    item.unit ||
                    itemLookup[
                        item.itemName
                    ]?.unit ||
                    "",

                qty: 0,

                price: 0
            }));


        renderTableRows();

        calculateTotals();

        saveDraft();
    }
}


// ==========================================
// RENDER TABLE
// ==========================================

function renderTableRows() {

    const tbody =
        document.getElementById(
            "itemsTableBody"
        );

    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    currentRows.forEach(
        (row, index) => {

            const itemInfo =
                itemLookup[
                    row.itemName
                ] || {

                    unit:
                        row.unit ||
                        "หน่วย",

                    category:
                        row.category ||
                        "อื่นๆ"
                };


            const isSalesItem =
                row.itemName === "ขายได้";


            const tr =
                document.createElement(
                    "tr"
                );


            tr.className =
                `transition ${
                    isSalesItem
                        ? "bg-emerald-50/40"
                        : "hover:bg-slate-50"
                }`;


            const qty =
                row.qty !== 0 &&
                row.qty !== ""
                    ? row.qty
                    : "";


            const price =
                row.price !== 0 &&
                row.price !== ""
                    ? row.price
                    : "";


            tr.innerHTML = `

                <td class="py-2.5 px-3">

                    <select
                        id="select-item-${index}"
                        onchange="onItemSelect(${index}, this.value)"
                        onkeydown="handleEnterKey(event, ${index})"
                        class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >

                        ${generateDropdownOptions(
                            row.itemName
                        )}

                    </select>

                </td>


                <td class="py-2.5 px-3">

                    <div class="relative flex items-center">

                        <input
                            type="number"
                            step="any"
                            min="0"
                            id="qty-input-${index}"
                            value="${qty}"
                            placeholder="0"
                            oninput="updateRow(${index}, 'qty', this.value)"
                            onkeydown="handleEnterKey(event, ${index})"
                            class="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-16 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >

                        <span class="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">
                            ${itemInfo.unit || ""}
                        </span>

                    </div>

                </td>


                <td class="py-2.5 px-3">

                    <input
                        type="number"
                        step="any"
                        min="0"
                        id="price-input-${index}"
                        value="${price}"
                        placeholder="0"
                        ${isSalesItem ? "readonly" : ""}
                        oninput="updateRow(${index}, 'price', this.value)"
                        onkeydown="handleEnterKey(event, ${index})"
                        class="w-full border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none ${
                            isSalesItem
                                ? "bg-emerald-100/60 border-emerald-300 text-emerald-800 cursor-not-allowed"
                                : "bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-emerald-500"
                        }"
                    >

                </td>


                <td class="py-2.5 px-3 text-center">

                    <button
                        onclick="removeRow(${index})"
                        class="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg transition"
                        title="ลบแถวนี้"
                    >

                        <i
                            data-lucide="trash-2"
                            class="w-4 h-4"
                        ></i>

                    </button>

                </td>

            `;


            tbody.appendChild(tr);
        }
    );


    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }
}


// ==========================================
// DROPDOWN
// ==========================================

function generateDropdownOptions(
    selectedItem
) {

    let html =
        `<option value="">-- เลือกรายการ --</option>`;


    INGREDIENT_GROUPS.forEach(
        group => {

            html +=
                `<optgroup label="📍 ${group.category}">`;


            group.items.forEach(
                item => {

                    const selected =
                        item.name ===
                        selectedItem
                            ? "selected"
                            : "";


                    const displayName =
                        item.nameDisplay ||
                        item.name;


                    html += `
                        <option
                            value="${item.name}"
                            ${selected}
                        >
                            ${displayName} (${item.unit})
                        </option>
                    `;
                }
            );


            html +=
                `</optgroup>`;
        }
    );


    return html;
}


// ==========================================
// ENTER
// ==========================================

function handleEnterKey(
    event,
    index
) {

    if (event.key === "Enter") {

        event.preventDefault();

        addRowAndFocus();
    }
}


// ==========================================
// ADD ROW
// ==========================================

function addRowAndFocus() {

    currentRows.push({

        itemName: "",

        category: "อื่นๆ",

        unit: "",

        qty: 0,

        price: 0

    });


    renderTableRows();

    calculateTotals();

    saveDraft();


    setTimeout(() => {

        const index =
            currentRows.length - 1;

        const select =
            document.getElementById(
                `select-item-${index}`
            );

        if (select) {
            select.focus();
        }

    }, 50);
}


// ==========================================
// ITEM SELECT
// ==========================================

function onItemSelect(
    index,
    newItemName
) {

    const info =
        itemLookup[newItemName];


    currentRows[index].itemName =
        newItemName;


    currentRows[index].category =
        info?.category ||
        "อื่นๆ";


    currentRows[index].unit =
        info?.unit ||
        "";


    if (
        newItemName === "ขายได้"
    ) {

        const qty =
            parseFloat(
                currentRows[index].qty
            ) || 0;


        currentRows[index].price =
            qty * PRICE_PER_BOX;

    } else {

        currentRows[index].price =
            0;
    }


    renderTableRows();

    calculateTotals();

    saveDraft();


    const qtyInput =
        document.getElementById(
            `qty-input-${index}`
        );


    if (qtyInput) {
        qtyInput.focus();
    }
}


// ==========================================
// UPDATE ROW
// ==========================================

function updateRow(
    index,
    field,
    value
) {

    const numVal =
        value === ""
            ? 0
            : parseFloat(value);


    currentRows[index][field] =
        Number.isNaN(numVal)
            ? 0
            : numVal;


    if (
        currentRows[index].itemName ===
        "ขายได้"
    ) {

        if (field === "qty") {

            const calculatedPrice =
                numVal * PRICE_PER_BOX;


            currentRows[index].price =
                calculatedPrice;


            const priceInput =
                document.getElementById(
                    `price-input-${index}`
                );


            if (priceInput) {

                priceInput.value =
                    calculatedPrice > 0
                        ? calculatedPrice
                        : "";
            }
        }
    }


    calculateTotals();

    saveDraft();
}


// ==========================================
// REMOVE ROW
// ==========================================

function removeRow(index) {

    const item =
        currentRows[index];


    const itemName =
        item?.itemName
            ? `"${item.itemName}"`
            : "แถวนี้";


    if (
        !confirm(
            `คุณต้องการลบรายการ ${itemName} ใช่หรือไม่?`
        )
    ) {

        return;
    }


    currentRows.splice(
        index,
        1
    );


    if (
        currentRows.length === 0
    ) {

        currentRows = [
            {
                itemName: "ขายได้",
                qty: 0,
                price: 0
            }
        ];
    }


    renderTableRows();

    calculateTotals();

    saveDraft();
}


// ==========================================
// CLEAR TABLE
// ==========================================

function clearAllRows() {

    if (
        !confirm(
            "ต้องการล้างตารางของวันนี้ใช่หรือไม่?"
        )
    ) {

        return;
    }


    const dateStr =
        document.getElementById(
            "recordDate"
        )?.value;


    currentRows = [
        {
            itemName: "ขายได้",
            qty: 0,
            price: 0
        }
    ];


    if (dateStr) {

        localStorage.removeItem(
            `suki_draft_${dateStr}`
        );
    }


    renderTableRows();

    calculateTotals();
}


// ==========================================
// CALCULATE TOTALS
// ==========================================

function calculateTotals() {

    let totalRevenue = 0;

    let totalExpense = 0;

    let boxesSold = 0;


    currentRows.forEach(row => {

        if (
            row.itemName ===
            "ขายได้"
        ) {

            boxesSold +=
                parseFloat(
                    row.qty
                ) || 0;


            totalRevenue +=
                parseFloat(
                    row.price
                ) || 0;

        } else if (
            row.itemName
        ) {

            totalExpense +=
                parseFloat(
                    row.price
                ) || 0;
        }
    });


    const netProfit =
        totalRevenue -
        totalExpense;


    const margin =
        totalRevenue > 0
            ? (
                netProfit /
                totalRevenue *
                100
            ).toFixed(1)
            : "0";


    document.getElementById(
        "totalRevenue"
    ).innerText =
        totalRevenue.toLocaleString();


    document.getElementById(
        "boxesSoldText"
    ).innerText =
        `ขายได้ ${boxesSold.toLocaleString()} กล่อง`;


    document.getElementById(
        "totalExpense"
    ).innerText =
        totalExpense.toLocaleString();


    document.getElementById(
        "netProfit"
    ).innerText =
        netProfit.toLocaleString();


    document.getElementById(
        "profitMarginText"
    ).innerText =
        `Profit Margin ${margin}%`;
}


// ==========================================
// CREATE LOG DATA
// ==========================================

function createLogData(dateStr) {

    const filteredItems =
        currentRows.filter(
            row =>
                row.itemName &&
                (
                    Number(row.qty) > 0 ||
                    Number(row.price) > 0
                )
        );


    let totalRevenue = 0;

    let totalExpense = 0;

    let boxesSold = 0;


    const items =
        filteredItems.map(row => {

            const info =
                itemLookup[
                    row.itemName
                ] || {};


            const item = {

                category:
                    row.category ||
                    info.category ||
                    "อื่นๆ",

                itemName:
                    row.itemName,

                qty:
                    Number(row.qty) || 0,

                unit:
                    row.unit ||
                    info.unit ||
                    "",

                price:
                    Number(row.price) || 0
            };


            if (
                item.itemName ===
                "ขายได้"
            ) {

                boxesSold +=
                    item.qty;

                totalRevenue +=
                    item.price;

            } else {

                totalExpense +=
                    item.price;
            }


            return item;
        });


    return {

        date: dateStr,

        items: items,

        boxesSold:
            boxesSold,

        totalRevenue:
            totalRevenue,

        totalExpense:
            totalExpense,

        netProfit:
            totalRevenue -
            totalExpense
    };
}


// ==========================================
// SAVE DAILY DATA
// ==========================================

async function saveDailyData() {

    const dateStr =
        document.getElementById(
            "recordDate"
        )?.value;


    if (!dateStr) {

        alert(
            "กรุณาเลือกวันที่"
        );

        return;
    }


    const logData =
        createLogData(dateStr);


    allLogs[dateStr] =
        logData;


    localStorage.setItem(
        "suki_roll_logs_v3",
        JSON.stringify(allLogs)
    );


    localStorage.removeItem(
        `suki_draft_${dateStr}`
    );


    renderHistoryTable();

    calculateTotals();


    showStatusBanner(
        "บันทึกข้อมูลเรียบร้อยแล้ว!",
        "bg-emerald-500 text-white"
    );


    // Sync Google Sheets
    if (gasUrl) {

        await syncSingleLogToGS(
            logData
        );
    }
}


// ==========================================
// HISTORY TABLE
// ==========================================

function renderHistoryTable() {

    const tbody =
        document.getElementById(
            "historyTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const sortedDates =
        Object.keys(allLogs)
            .sort()
            .reverse();


    if (
        sortedDates.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="text-center py-6 text-slate-400"
                >
                    ยังไม่มีข้อมูลบันทึกประวัติ
                </td>
            </tr>
        `;

        return;
    }


    sortedDates.forEach(
        dateStr => {

            const log =
                allLogs[dateStr];


            const revenue =
                Number(
                    log.totalRevenue
                ) || 0;


            const expense =
                Number(
                    log.totalExpense
                ) || 0;


            const profit =
                Number(
                    log.netProfit
                ) || 0;


            const boxes =
                Number(
                    log.boxesSold
                ) || 0;


            const tr =
                document.createElement(
                    "tr"
                );


            tr.className =
                "hover:bg-slate-50 transition";


            tr.innerHTML = `

                <td class="px-6 py-4 font-semibold text-slate-700">
                    ${log.date}
                </td>

                <td class="px-6 py-4">
                    ${boxes.toLocaleString()} กล่อง
                </td>

                <td class="px-6 py-4 text-emerald-600 font-semibold">
                    ${revenue.toLocaleString()}
                </td>

                <td class="px-6 py-4 text-rose-500 font-semibold">
                    ${expense.toLocaleString()}
                </td>

                <td class="px-6 py-4 font-bold ${
                    profit >= 0
                        ? "text-amber-600"
                        : "text-rose-600"
                }">
                    ${profit.toLocaleString()}
                </td>

                <td class="px-6 py-4 text-right">

                    <button
                        onclick="editDate('${dateStr}')"
                        class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg mr-1 transition"
                    >
                        แก้ไข
                    </button>

                    <button
                        onclick="deleteLog('${dateStr}')"
                        class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg transition"
                    >
                        ลบ
                    </button>

                </td>
            `;


            tbody.appendChild(tr);
        }
    );
}


// ==========================================
// EDIT DATE
// ==========================================

function editDate(dateStr) {

    const dateInput =
        document.getElementById(
            "recordDate"
        );


    if (dateInput) {
        dateInput.value = dateStr;
    }


    loadDateData(dateStr);

    switchTab("entry");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// DELETE LOG
// ==========================================

async function deleteLog(dateStr) {

    if (
        !confirm(
            `ต้องการลบประวัติวันที่ ${dateStr} หรือไม่?`
        )
    ) {

        return;
    }


    delete allLogs[dateStr];


    localStorage.setItem(
        "suki_roll_logs_v3",
        JSON.stringify(allLogs)
    );


    const currentDate =
        document.getElementById(
            "recordDate"
        )?.value;


    if (
        currentDate === dateStr
    ) {

        loadDateData(
            dateStr
        );
    }


    renderHistoryTable();


    // ลบจาก Google Sheets ด้วย
    if (gasUrl) {

        await deleteDateFromGoogleSheets(
            dateStr
        );
    }
}


// ==========================================
// SAVE GAS URL
// ==========================================

function saveGasUrl() {

    const input =
        document.getElementById(
            "gasUrlInput"
        );


    if (!input) {
        return;
    }


    const url =
        input.value.trim();


    if (
        url &&
        !url.startsWith(
            "https://script.google.com/"
        )
    ) {

        alert(
            "URL ไม่ถูกต้อง\n\nกรุณาใช้ Google Apps Script Web App URL"
        );

        return;
    }


    gasUrl =
        url;


    localStorage.setItem(
        "suki_roll_gas_url",
        url
    );


    showStatusBanner(
        "บันทึก URL ของ Google Sheets เรียบร้อย!",
        "bg-emerald-600 text-white"
    );
}


// ==========================================
// SYNC SINGLE
// ==========================================

async function syncSingleLogToGS(
    logData,
    showMessage = true
) {

    if (!gasUrl) {
        return false;
    }


    if (showMessage) {

        showStatusBanner(
            "กำลัง Sync ข้อมูลไปยัง Google Sheets...",
            "bg-amber-500 text-white"
        );
    }


    try {

        const response =
            await fetch(
                gasUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({
                            action:
                                "syncSingle",

                            data:
                                logData
                        })
                }
            );


        // อ่าน response ถ้า browser อนุญาต
        let result = null;

        try {

            result =
                await response.json();

        } catch (e) {
            // no-cors / redirect บางกรณีอ่าน response ไม่ได้
        }


        if (
            result &&
            result.status === "error"
        ) {

            throw new Error(
                result.message
            );
        }


        if (showMessage) {

            showStatusBanner(
                "Sync เข้า Google Sheets เรียบร้อยแล้ว!",
                "bg-emerald-600 text-white"
            );
        }


        return true;

    } catch (error) {

        console.error(
            "Google Sheets Sync Error:",
            error
        );


        if (showMessage) {

            showStatusBanner(
                "บันทึกในเครื่องแล้ว แต่ Sync Google Sheets ไม่สำเร็จ",
                "bg-rose-500 text-white"
            );
        }


        return false;
    }
}


// ==========================================
// SYNC ALL
// ==========================================

async function syncAllToGoogleSheets() {

    if (!gasUrl) {

        alert(
            "กรุณาตั้งค่า Google Sheets Web App URL ในแท็บ Google Sheets ก่อน"
        );

        switchTab("settings");

        return;
    }


    const logsArray =
        Object.values(
            allLogs
        );


    if (
        logsArray.length === 0
    ) {

        alert(
            "ไม่มีข้อมูลสำหรับ Sync"
        );

        return;
    }


    showStatusBanner(
        "กำลังส่งข้อมูลทั้งหมดไปยัง Google Sheets...",
        "bg-amber-500 text-white"
    );


    try {

        const response =
            await fetch(
                gasUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({
                            action:
                                "syncAll",

                            logs:
                                logsArray
                        })
                }
            );


        let result = null;

        try {
            result =
                await response.json();
        } catch (e) {
            // response อาจอ่านไม่ได้
        }


        if (
            result &&
            result.status === "error"
        ) {

            throw new Error(
                result.message
            );
        }


        showStatusBanner(
            "ส่งข้อมูลทั้งหมดเข้า Google Sheets สำเร็จ!",
            "bg-emerald-600 text-white"
        );


        return true;

    } catch (error) {

        console.error(
            "Sync All Error:",
            error
        );


        showStatusBanner(
            "เกิดข้อผิดพลาดในการส่งข้อมูลไป Google Sheets",
            "bg-rose-500 text-white"
        );


        return false;
    }
}


// ==========================================
// DELETE FROM GOOGLE SHEETS
// ==========================================

async function deleteDateFromGoogleSheets(
    dateStr
) {

    if (!gasUrl) {
        return;
    }


    try {

        await fetch(
            gasUrl,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify({
                        action:
                            "deleteDate",

                        date:
                            dateStr
                    })
            }
        );


        showStatusBanner(
            `ลบข้อมูลวันที่ ${dateStr} เรียบร้อยแล้ว`,
            "bg-emerald-600 text-white"
        );

    } catch (error) {

        console.error(
            "Delete Google Sheets Error:",
            error
        );


        showStatusBanner(
            "ลบข้อมูลในเครื่องแล้ว แต่ลบจาก Google Sheets ไม่สำเร็จ",
            "bg-rose-500 text-white"
        );
    }
}


// ==========================================
// GET DATA FROM GOOGLE SHEETS
// ==========================================

async function loadDataFromGoogleSheets(
    showMessage = true
) {

    if (!gasUrl) {

        if (showMessage) {

            alert(
                "กรุณาตั้งค่า Google Apps Script Web App URL ก่อน"
            );

            switchTab("settings");
        }

        return false;
    }


    if (showMessage) {

        showStatusBanner(
            "กำลังดึงข้อมูลจาก Google Sheets...",
            "bg-amber-500 text-white"
        );
    }


    try {

        const url =
            gasUrl +
            (
                gasUrl.includes("?")
                    ? "&"
                    : "?"
            ) +
            "action=getLogs&_=" +
            Date.now();


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const result =
            await response.json();


        if (
            result.status !==
            "success"
        ) {

            throw new Error(
                result.message ||
                "Google Apps Script Error"
            );
        }


        const googleLogs =
            result.logs || {};


        // =====================================
        // Google Sheets = Source of Truth
        // =====================================

        allLogs =
            normalizeLogs(
                googleLogs
            );


        localStorage.setItem(
            "suki_roll_logs_v3",
            JSON.stringify(allLogs)
        );


        renderHistoryTable();


        const currentDate =
            document.getElementById(
                "recordDate"
            )?.value;


        if (currentDate) {

            loadDateData(
                currentDate
            );
        }


        if (showMessage) {

            const totalDays =
                Object.keys(
                    allLogs
                ).length;


            showStatusBanner(
                `ดึงข้อมูลสำเร็จ ${totalDays} วันจาก Google Sheets`,
                "bg-emerald-600 text-white"
            );
        }


        return true;

    } catch (error) {

        console.error(
            "Load Google Sheets Error:",
            error
        );


        if (showMessage) {

            showStatusBanner(
                "ไม่สามารถดึงข้อมูลจาก Google Sheets ได้",
                "bg-rose-500 text-white"
            );
        }


        return false;
    }
}


// ==========================================
// NORMALIZE LOGS
// ==========================================

function normalizeLogs(
    logs
) {

    const normalized = {};


    Object.keys(
        logs || {}
    ).forEach(dateStr => {

        const log =
            logs[dateStr];


        const items =
            Array.isArray(
                log.items
            )
                ? log.items
                : [];


        let totalRevenue = 0;

        let totalExpense = 0;

        let boxesSold = 0;


        const cleanItems =
            items
                .filter(
                    item =>
                        item &&
                        item.itemName
                )
                .map(item => {

                    const info =
                        itemLookup[
                            item.itemName
                        ] || {};


                    const cleanItem = {

                        category:
                            item.category ||
                            info.category ||
                            "อื่นๆ",

                        itemName:
                            item.itemName,

                        qty:
                            Number(
                                item.qty
                            ) || 0,

                        unit:
                            item.unit ||
                            info.unit ||
                            "",

                        price:
                            Number(
                                item.price
                            ) || 0
                    };


                    if (
                        cleanItem.itemName ===
                        "ขายได้"
                    ) {

                        boxesSold +=
                            cleanItem.qty;

                        totalRevenue +=
                            cleanItem.price;

                    } else {

                        totalExpense +=
                            cleanItem.price;
                    }


                    return cleanItem;
                });


        normalized[dateStr] = {

            date:
                dateStr,

            items:
                cleanItems,

            boxesSold:
                boxesSold,

            totalRevenue:
                totalRevenue,

            totalExpense:
                totalExpense,

            netProfit:
                totalRevenue -
                totalExpense
        };

    });


    return normalized;
}


// ==========================================
// TEST GAS CONNECTION
// ==========================================

async function testGasConnection() {

    if (!gasUrl) {

        alert(
            "กรุณากรอก URL ก่อน"
        );

        return;
    }


    showStatusBanner(
        "กำลังทดสอบการเชื่อมต่อ...",
        "bg-amber-500 text-white"
    );


    try {

        const url =
            gasUrl +
            (
                gasUrl.includes("?")
                    ? "&"
                    : "?"
            ) +
            "action=ping&_=" +
            Date.now();


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        const result =
            await response.json();


        if (
            result.status !==
            "success"
        ) {

            throw new Error(
                result.message
            );
        }


        showStatusBanner(
            "การเชื่อมต่อสมบูรณ์พร้อมใช้งาน!",
            "bg-emerald-600 text-white"
        );

    } catch (error) {

        console.error(
            "Connection Test Error:",
            error
        );


        showStatusBanner(
            "ไม่สามารถเชื่อมต่อกับ Web App ได้",
            "bg-rose-500 text-white"
        );
    }
}


// ==========================================
// STATUS BANNER
// ==========================================

function showStatusBanner(
    text,
    bgClass
) {

    const banner =
        document.getElementById(
            "syncStatusBanner"
        );


    const statusText =
        document.getElementById(
            "syncStatusText"
        );


    if (
        !banner ||
        !statusText
    ) {

        return;
    }


    banner.className =
        `p-3 rounded-xl text-xs sm:text-sm font-medium flex justify-between items-center transition shadow-sm ${bgClass}`;


    statusText.innerText =
        text;


    banner.classList.remove(
        "hidden"
    );
}


// ==========================================
// EXPORT EXCEL
// ==========================================

function exportToExcel() {

    const sortedDates =
        Object.keys(allLogs)
            .sort();


    if (
        sortedDates.length === 0
    ) {

        alert(
            "ไม่มีข้อมูลส่งออก"
        );

        return;
    }


    const excelRows = [];


    sortedDates.forEach(
        dateStr => {

            const log =
                allLogs[dateStr];


            (log.items || [])
                .forEach(item => {

                    const info =
                        itemLookup[
                            item.itemName
                        ] || {};


                    excelRows.push({

                        "วันที่":
                            log.date,

                        "หมวดหมู่":
                            item.category ||
                            info.category ||
                            "อื่นๆ",

                        "รายการ":
                            item.itemName,

                        "จำนวน":
                            item.qty,

                        "หน่วย":
                            item.unit ||
                            info.unit ||
                            "",

                        "ราคา/ยอดรวม (บาท)":
                            item.price,

                        "ประเภท":
                            item.itemName ===
                            "ขายได้"
                                ? "รายรับ"
                                : "รายจ่าย"
                    });

                });
        }
    );


    const worksheet =
        XLSX.utils.json_to_sheet(
            excelRows
        );


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "ยอดขายและวัตถุดิบ"
    );


    XLSX.writeFile(
        workbook,
        `SukiRoll_Report_${getLocalDateString()}.xlsx`
    );
}


// ==========================================
// ANALYTICS
// ==========================================

function renderAnalyticsCharts() {

    const sortedDates =
        Object.keys(allLogs)
            .sort();


    if (
        sortedDates.length === 0
    ) {

        document.getElementById(
            "avgBoxes"
        ).innerText = "0";


        document.getElementById(
            "accRevenue"
        ).innerText = "0";


        document.getElementById(
            "expenseRatio"
        ).innerText = "0";


        return;
    }


    const labels = [];

    const revenueData = [];

    const expenseData = [];

    const profitData = [];

    const boxesData = [];


    let totalBoxes = 0;

    let totalRev = 0;

    let totalExp = 0;


    sortedDates.forEach(
        dateStr => {

            const log =
                allLogs[dateStr];


            const revenue =
                Number(
                    log.totalRevenue
                ) || 0;


            const expense =
                Number(
                    log.totalExpense
                ) || 0;


            const profit =
                Number(
                    log.netProfit
                ) || 0;


            const boxes =
                Number(
                    log.boxesSold
                ) || 0;


            labels.push(
                log.date
            );


            revenueData.push(
                revenue
            );


            expenseData.push(
                expense
            );


            profitData.push(
                profit
            );


            boxesData.push(
                boxes
            );


            totalBoxes +=
                boxes;

            totalRev +=
                revenue;

            totalExp +=
                expense;
        }
    );


    const totalDays =
        sortedDates.length;


    document.getElementById(
        "avgBoxes"
    ).innerText =
        (
            totalBoxes /
            totalDays
        ).toFixed(1);


    document.getElementById(
        "accRevenue"
    ).innerText =
        totalRev.toLocaleString();


    document.getElementById(
        "expenseRatio"
    ).innerText =
        totalRev > 0
            ? (
                totalExp /
                totalRev *
                100
            ).toFixed(1)
            : "0";


    // =====================================
    // FINANCIAL CHART
    // =====================================

    if (
        trendChartInstance
    ) {

        trendChartInstance.destroy();

    }


    const trendCanvas =
        document.getElementById(
            "financialTrendChart"
        );


    if (trendCanvas) {

        const ctx =
            trendCanvas.getContext(
                "2d"
            );


        trendChartInstance =
            new Chart(
                ctx,
                {
                    type: "line",

                    data: {

                        labels:
                            labels,

                        datasets: [

                            {
                                label:
                                    "ยอดขาย (บาท)",

                                data:
                                    revenueData,

                                borderColor:
                                    "#10b981",

                                backgroundColor:
                                    "rgba(16, 185, 129, 0.1)",

                                tension:
                                    0.3,

                                fill:
                                    true
                            },

                            {
                                label:
                                    "รายจ่าย (บาท)",

                                data:
                                    expenseData,

                                borderColor:
                                    "#f43f5e",

                                backgroundColor:
                                    "transparent",

                                tension:
                                    0.3
                            },

                            {
                                label:
                                    "กำไร (บาท)",

                                data:
                                    profitData,

                                borderColor:
                                    "#d97706",

                                backgroundColor:
                                    "transparent",

                                borderDash:
                                    [5, 5],

                                tension:
                                    0.3
                            }

                        ]
                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                position:
                                    "bottom"
                            }
                        }
                    }
                }
            );
    }


    // =====================================
    // BOXES CHART
    // =====================================

    if (
        boxesChartInstance
    ) {

        boxesChartInstance.destroy();

    }


    const boxesCanvas =
        document.getElementById(
            "boxesSoldChart"
        );


    if (boxesCanvas) {

        const ctx =
            boxesCanvas.getContext(
                "2d"
            );


        boxesChartInstance =
            new Chart(
                ctx,
                {
                    type: "bar",

                    data: {

                        labels:
                            labels,

                        datasets: [

                            {
                                label:
                                    "จำนวนกล่องที่ขายได้",

                                data:
                                    boxesData,

                                backgroundColor:
                                    "#f59e0b",

                                borderRadius:
                                    8
                            }

                        ]
                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                display:
                                    false
                            }
                        }
                    }
                }
            );
    }
}