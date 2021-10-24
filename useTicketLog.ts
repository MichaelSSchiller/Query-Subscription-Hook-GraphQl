// External
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { isBefore, addHours, addDays } from "date-fns";
// Internal
import { TICKET_LOG_ROOT } from "../../paths";
import { OrderBy, Scalars } from "../../graphqlTypes";
import useTicketLogParams from "./useTicketLogParams";
import {
  useInternalTicketLogQuery,
  InternalTicketLogSubscriptionDocument,
  UpdateTicketLogAggregateDocument,
  InternalTicketLogSubscription,
  InternalTicketLogSubscriptionVariables,
  UpdateTicketLogAggregateSubscription,
  UpdateTicketLogAggregateSubscriptionVariables,
} from "./ticketLogGQL";

const pageRows = 20;

const queryStatus: { [key: number]: Scalars["ticket_status_type"] } = {
  1: "SENT",
  2: "SAVED",
  3: "CANCELED",
};

export default () => {
  const { accountId, pageNumber } =
    useParams<{ accountId: string; pageNumber: string }>();

  const { startDate, endDate, locations, status, sortColumn, sortDirection } =
    useTicketLogParams();

  const currentPage = Number(pageNumber);

  const orderBy = useMemo(() => {
    const direction = sortDirection === "desc" ? OrderBy.Desc : OrderBy.Asc;
    const obc = [
      { createdTime: direction },
      { name: direction },
      { truckId: direction },
    ];
    if (sortColumn === "truckId") obc.reverse();
    return obc;
  }, [sortColumn, sortDirection]);

  const where = useMemo(
    () => ({
      accountId: { _eq: Number(accountId) },
      ...(!!locations.length && { locationId: { _in: locations } }),
      ...(status !== 4 && { ticket_status: { _eq: queryStatus[status] } }),
      createdTime: {
        _gte: startDate.toISOString(),
        _lt: addDays(endDate, 1).toISOString(),
      },
    }),
    [accountId, endDate, locations, startDate, status],
  );

  // TODO add source to query
  const { data, loading, subscribeToMore } = useInternalTicketLogQuery({
    skip: !accountId || !startDate || !endDate,
    variables: {
      limit: pageRows,
      offset: (currentPage - 1) * pageRows,
      where,
      orderBy,
    },
    notifyOnNetworkStatusChange: true,
  });

  const hasCurrentDay = isBefore(new Date(), addHours(endDate, 32));

  useEffect(() => {
    if (hasCurrentDay) {
      return subscribeToMore<
        InternalTicketLogSubscription,
        InternalTicketLogSubscriptionVariables
      >({
        document: InternalTicketLogSubscriptionDocument,
        variables: {
          limit: pageRows,
          offset: (currentPage - 1) * pageRows,
          where,
          orderBy,
        },
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData.data) return prev;
          return {
            ...prev,
            localTickets: subscriptionData.data.localTickets,
          };
        },
      });
    }
    return undefined;
  }, [currentPage, hasCurrentDay, orderBy, subscribeToMore, where]);

  useEffect(() => {
    if (hasCurrentDay) {
      return subscribeToMore<
        UpdateTicketLogAggregateSubscription,
        UpdateTicketLogAggregateSubscriptionVariables
      >({
        document: UpdateTicketLogAggregateDocument,
        variables: {
          where,
        },
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData.data) return prev;
          return {
            ...prev,
            localTicketAggregate: subscriptionData.data.localTicketAggregate,
          };
        },
      });
    }
    return undefined;
  }, [hasCurrentDay, subscribeToMore, where]);

  const tickets = data?.localTickets || [];
  const count = data?.localTicketAggregate?.aggregate?.count || 0;

  const totalPages = Math.ceil(count / pageRows);
  const PAGINATION_URL = `${TICKET_LOG_ROOT}/${accountId}`;

  return {
    currentPage,
    loading,
    PAGINATION_URL,
    tickets,
    totalPages,
  };
};
