import parseDate from "date-fns/parse";
export const dateToken = "dd.MM.y HH:mm:ss";
export const getFQDataFromFileName = (fileName) => {
  const FQDataList = fileName.split(".")[0].split("_");
  const length = FQDataList.length;

  const date = FQDataList[0];
  const time = FQDataList[1];

  const dateStr =
    `${date.slice(0, 2)}.${date.slice(2, 4)}.2023` +
    " " +
    `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;
  // console.log(dateStr, {
  //   date,
  //   time,
  // });
  const dateTime = parseDate(dateStr, dateToken, new Date());
  // console.log(123, dateTime);

  return {
    dateTime,
    frequency: FQDataList[length - 2],
    bandwidth: FQDataList[length - 1],
  };
};
