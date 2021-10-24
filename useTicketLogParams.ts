import { useContext, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
// Internal
import {
  getParsedParams,
  UrlParamKeys,
  AccountContext,
  updateHistory,
} from "@vitm/components";

// NOTE add startDate and endDate to url if they are missing
export const useDefaultDateParams = () => {
  const { sd: startDate, ed: endDate } = getParsedParams(useLocation());
  const history = useHistory();
  const { defaultDate } = useContext(AccountContext);
  useEffect(() => {
    if (!startDate || !endDate) {
      updateHistory(history, {
        ...(!startDate && {
          [UrlParamKeys.StartDate]: defaultDate.getTime(),
        }),
        ...(!endDate && {
          [UrlParamKeys.EndDate]: defaultDate.getTime(),
        }),
      });
    }
  }, [defaultDate, endDate, history, startDate]);
};

const getSortParam = (param: "ct" | "t" | "tn") => {
  switch (param) {
    case "ct":
      return "createdTime";
    case "t":
      return "truckId";
    case "tn":
      return "name";
    default:
      return "createdTime";
  }
};

export default () => {
  const { defaultDate } = useContext(AccountContext);

  const ticketLogParams: TicketLogParams = {
    startDate: defaultDate,
    endDate: defaultDate,
    locations: [],
    status: 4,
    sortColumn: "createdTime",
    sortDirection: "asc",
  };

  const params = getParsedParams(useLocation());

  Object.entries(params).forEach(([key, param]) => {
    if (param) {
      if (key === UrlParamKeys.StartDate || key === UrlParamKeys.EndDate) {
        ticketLogParams[
          key === UrlParamKeys.StartDate ? "startDate" : "endDate"
        ] = new Date(Number(param));
      } else if (key === UrlParamKeys.Location) {
        if (Array.isArray(param)) {
          ticketLogParams.locations = param.map((value) => Number(value));
        } else {
          ticketLogParams.locations = [Number(param)];
        }
      } else if (key === UrlParamKeys.Status) {
        ticketLogParams.status = Number(param);
      } else if (
        key === UrlParamKeys.SortColumn &&
        (param === "ct" || param === "t" || param === "tn")
      ) {
        ticketLogParams.sortColumn = getSortParam(param);
      } else if (
        key === UrlParamKeys.SortDirection &&
        (param === "a" || param === "d")
      ) {
        ticketLogParams.sortDirection = param === "a" ? "asc" : "desc";
      }
    }
  });
  return ticketLogParams;
};

export interface TicketLogParams {
  startDate: Date;
  endDate: Date;
  status: number;
  locations: number[];
  sortColumn: "createdTime" | "truckId" | "name";
  sortDirection: "asc" | "desc";
}
