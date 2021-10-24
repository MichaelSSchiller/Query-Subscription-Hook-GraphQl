import React, { FC } from "react";
import { renderHook } from "@testing-library/react-hooks";
import { MemoryRouterProps } from "react-router";
import { MemoryRouter } from "react-router-dom";
import useTicketLogParams, { TicketLogParams } from "./useTicketLogParams";

const Wrapper: FC<MemoryRouterProps> = ({ children, initialEntries }) => (
  <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
);

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
    const { result } = renderHook(() => useTicketLogParams(), {
      wrapper: Wrapper,
      initialProps: {
        initialEntries: [`/ticketlog/1/1?${urlParam}=${value}`],
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
