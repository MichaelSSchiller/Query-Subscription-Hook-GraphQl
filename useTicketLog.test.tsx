import React, { FC } from "react";
import {
  MockedProvider,
  MockedProviderProps,
  MockedResponse,
  MockSubscriptionLink,
} from "@apollo/client/testing";
import { renderHook } from "@testing-library/react-hooks";
import { MemoryRouter, Route } from "react-router-dom";
// Internal
import { AccountContext, testAccount } from "@vitm/components";
import { TICKET_LOG_PATH } from "../../paths";
import {
  InternalTicketLogDocument,
  InternalTicketLogSubscriptionDocument,
  UpdateTicketLogAggregateDocument,
} from "./ticketLogGQL";
import useTicketLog from "./useTicketLog";

const resultData = [
  {
    name: "420292",
    id: 1004,
    createdTime: "2021-08-06T18:06:09.734207+00:00",
    loadStartTime: null,
    updateAt: "2021-08-06T15:06:09.734207+00:00",
    ticket_received_time: "2021-08-06T18:06:09.734207+00:00",
    ticket_status: "SAVED",
    ticket_source: "MANUAL",
    driver: {
      name: "Charles Sheen",
      id: 4,
      __typename: "vitm_driver",
    },
    location: {
      name: "Manchester By The Sea is a Long Location Name",
      id: 3,
      __typename: "vitm_location",
    },
    plant: {
      name: "D1",
      id: 3,
      __typename: "vitm_plant",
    },
    __typename: "vitm_local_ticket",
  },
];

const defaultVariables = {
  limit: 20,
  offset: 0,
  where: {
    accountId: {
      _eq: 1,
    },
    createdTime: {
      _gte: "2021-08-06T04:00:00.000Z",
      _lt: "2021-08-07T04:00:00.000Z",
    },
  },
  orderBy: [{ createdTime: "asc" }, { name: "asc" }, { truckId: "asc" }],
};

const defaultResult = {
  data: {
    localTickets: resultData,
    localTicketAggregate: {
      __typename: "vitm_local_ticket_aggregate",
      aggregate: {
        __typename: "vitm_local_ticket_aggregate_fields",
        count: 40,
      },
    },
  },
};

const defaultMocks = [
  {
    request: {
      query: InternalTicketLogDocument,
      variables: defaultVariables,
    },
    result: defaultResult,
  },
  {
    request: {
      query: InternalTicketLogSubscriptionDocument,
      variables: defaultVariables,
    },
    result: defaultResult,
  },
  {
    request: {
      query: UpdateTicketLogAggregateDocument,
      variables: { where: defaultVariables.where },
    },
    result: defaultResult,
  },
];

const Wrapper: FC<{
  mocks?: MockedResponse[];
  link?: MockedProviderProps["link"];
}> = ({ children, mocks = defaultMocks, link }) => (
  <AccountContext.Provider value={testAccount}>
    <MemoryRouter
      initialEntries={["/ticketlog/1/1?ed=1628222400000&sd=1628222400000"]}
    >
      <Route path={TICKET_LOG_PATH}>
        <MockedProvider mocks={mocks} addTypename link={link}>
          <>{children}</>
        </MockedProvider>
      </Route>
    </MemoryRouter>
  </AccountContext.Provider>
);

it("should return data", async () => {
  const { result, waitForNextUpdate } = renderHook(() => useTicketLog(), {
    wrapper: Wrapper,
  });

  await waitForNextUpdate();

  expect(result.current.tickets).toEqual(resultData);

  expect(result.current.totalPages).toEqual(2);
  expect(result.current.PAGINATION_URL).toEqual("/ticketlog/1");
  expect(result.current.currentPage).toEqual(1);
});

it("should update data from subscription", async () => {
  const link = new MockSubscriptionLink();
  const { result, waitForNextUpdate } = renderHook(() => useTicketLog(), {
    wrapper: Wrapper,
    initialProps: { link },
  });
  link.simulateResult({
    result: {
      data: {
        localTickets: [
          resultData[0],
          {
            name: "420293",
            id: 1005,
            createdTime: "2021-08-06T18:06:09.734207+00:00",
            loadStartTime: null,
            updateAt: "2021-08-06T15:06:09.734207+00:00",
            ticket_received_time: "2021-08-06T18:06:09.734207+00:00",
            ticket_status: "SAVED",
            ticket_source: "MANUAL",
            driver: {
              name: "Charles Sheen",
              id: 4,
              __typename: "vitm_driver",
            },
            location: {
              name: "Manchester By The Sea is a Long Location Name",
              id: 3,
              __typename: "vitm_location",
            },
            plant: {
              name: "D1",
              id: 3,
              __typename: "vitm_plant",
            },
            __typename: "vitm_local_ticket",
          },
        ],
        localTicketAggregate: {
          __typename: "vitm_local_ticket_aggregate",
          aggregate: {
            __typename: "vitm_local_ticket_aggregate_fields",
            count: 60,
          },
        },
      },
    },
  });

  await waitForNextUpdate();

  expect(result.current.tickets[0].name).toEqual("420292");
  expect(result.current.tickets[1].name).toEqual("420293");
  expect(result.current.totalPages).toEqual(3);

  link.simulateComplete();
});
