///Ki, Ka Lai 紀嘉麗
/* Input Type */
export type BillInput = {
  date: string;
  location: string;
  tipPercentage: number;
  items: BillItem[];
};

type BillItem = SharedBillItem | PersonalBillItem;

type CommonBillItem = {
  price: number;
  name: string;
};

type SharedBillItem = CommonBillItem & {
  isShared: true;
};

type PersonalBillItem = CommonBillItem & {
  isShared: false;
  person: string;
};

/* Output Type */
export type BillOutput = {
  date: string;
  location: string;
  subTotal: number;
  tip: number;
  totalAmount: number;
  items: PersonItem[];
};

type PersonItem = {
  name: string;
  amount: number;
};

/* Core Functions */
export function splitBill(input: BillInput): BillOutput {
  const date = formatDate(input.date);
  const location = input.location;
  const subTotal = calculateSubTotal(input.items);
  const tip = calculateTip(subTotal, input.tipPercentage);
  const totalAmount = subTotal + tip;

  const names = scanPersons(input.items);
  const persons = names.length;

  const items = names.map(name => ({
    name,
    amount: roundToOneDecimal(
      calculatePersonAmount({
        items: input.items,
        tipPercentage: input.tipPercentage,
        name,
        persons,
      })
    ),
  }));

  adjustAmount(totalAmount, items);

  return {
    date,
    location,
    subTotal: roundToTwoDecimals(subTotal),
    tip: roundToTwoDecimals(tip),
    totalAmount: roundToTwoDecimals(totalAmount),
    items,
  };
}

/* Format Date */
export function formatDate(date: string): string {
  // Input format: YYYY-MM-DD
  // Output format: YYYY年M月D日
  const [year, month, day] = date.split('-');
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}

/* Bill */
function calculateSubTotal(items: BillItem[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

/* Tips */
export function calculateTip(subTotal: number, tipPercentage: number): number {
  // Calculate tip based on percentage and round to nearest 0.1
  const tip = (subTotal * tipPercentage) / 100;
  return roundToOneDecimal(tip);
}

/* Persons */
function scanPersons(items: BillItem[]): string[] {
  const persons = new Set<string>();
  for (const item of items) {
    if (!item.isShared && item.person) {
      persons.add(item.person);
    }
  }
  return Array.from(persons);
}

/* Persons Amount */
function calculatePersonAmount(input: {
  items: BillItem[];
  tipPercentage: number;
  name: string;
  persons: number;
}): number {
  const { items, tipPercentage, name, persons } = input;

  let amount = 0;
  let sharedTotal = 0;

  for (const item of items) {
    if (item.isShared) {
      sharedTotal += item.price;
    } else if (item.person === name) {
      amount += item.price;
    }
  }

  // Add shared amount divided among participants
  amount += sharedTotal / persons;

  // Add tip proportionally
  const subTotal = calculateSubTotal(items);
  const tip = calculateTip(subTotal, tipPercentage);
  amount += (amount / subTotal) * tip;

  return amount;
}

/* Round */
function adjustAmount(totalAmount: number, items: PersonItem[]): void {
  const totalRounded = items.reduce((sum, item) => sum + item.amount, 0);
  const roundingError = roundToOneDecimal(totalAmount - totalRounded);

  // Adjust rounding error to the first person
  if (Math.abs(roundingError) > 0.01) {
    items[0].amount += roundingError;
    items[0].amount = roundToOneDecimal(items[0].amount); // Ensure proper rounding
  }
}

/* Round to 1 位小數*/
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/* Round to 2 位小數 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}