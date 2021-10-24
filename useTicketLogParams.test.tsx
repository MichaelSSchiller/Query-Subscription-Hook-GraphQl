import React, { FC } from "react";
import { renderHook } from "@testing-library/react-hooks";
import { Router } from "react-router-dom";
import { createMemoryHistory, MemoryHistory } from "history";
import { advanceTo, clear } from "jest-date-mock";
import { AccountContext } from "@vitm/components";
import { testAccount } from "@vitm/testing";

import useTicketLogParams, {
  TicketLogParams,
  useDefaultDateParams,
} from "./useTicketLogParams";

const defaultDate = "2021-05-04T13:35:12";

beforeEach(() => {
  advanceTo(new Date(defaultDate));
});

afterEach(() => {
  clear();
});

const Wrapper: FC<{ history: MemoryHistory }> = ({ children, history }) => (
  <AccountContext.Provider
    value={{
      ...testAccount,
      defaultDate,
    }}
  >
    <Router history={history}>{children}</Router>
  </AccountContext.Provider>
);

it("should add startDate and endDate if not already in url params - useDefaultDateParams()", () => {
  const history = createMemoryHistory({
    initialEntries: ["/ticketlog/1/1"],
  });

  renderHook(() => useDefaultDateParams(), {
    wrapper: Wrapper,
    initialProps: { history },
  });

  expect(history.location.search).toEqual(`?ed=1620111600000&sd=1620111600000`);
});

it.each`
  param              | urlParam | value              | expected
  ${"startDate"}     | ${"sd"}  | ${"1617595200000"} | ${new Date(1617595200000)}
  ${"endDate"}       | ${"ed"}  | ${"1617595200000"} | ${new Date(1617595200000)}
  ${"locations"}     | ${"lo"}  | ${"1,2"}           | ${[1, 2]}
  ${"status"}        | ${"sta"} | ${"1"}             | ${1}
  ${"status"}        | ${""}    | ${""}              | ${4}
  ${"sortDirection"} | ${"sdr"} | ${"a"}             | ${"asc"}
  ${"sortDirection"} | ${"sdr"} | ${"d"}             | ${"desc"}
  ${"sortColumn"}    | ${"sc"}  | ${"ct"}            | ${"createdTime"}
  ${"sortColumn"}    | ${"sc"}  | ${"t"}             | ${"truckId"}
  ${"sortColumn"}    | ${"sc"}  | ${"tn"}            | ${"name"}
`(
  "selected param $param should return $expected",
  ({ param, urlParam, value, expected }: TestParams) => {
    const history = createMemoryHistory({
      initialEntries: [`/ticketlog/1/1?${urlParam}=${value}`],
    });
    const { result } = renderHook(() => useTicketLogParams(), {
      wrapper: Wrapper,
      initialProps: {
        history,
      },
    });
    expect(result.current[param]).toStrictEqual(expected);
  },
);

interface TestParams {
  param: keyof TicketLogParams;
  urlParam: string;
  value: string;
  expected: string | string[];
}
