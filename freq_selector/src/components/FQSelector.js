import React, { useRef, useState } from "react";
import { getFQDataFromFileName, dateToken } from "../helpers/fileNameParser";
import useMouthPosition from "../hooks/useMosePotion";
import ScrollContainer from "react-indiana-drag-scroll";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import formatDate from "date-fns/format";
const MHz = 1000000;

const ZOOM_OPTIONS = [1, 1.5, 2, 3, 0.5, 0.1];

function FQSelector({ imgs }) {
  const [image, setImage] = useState();
  const [frequencyData, setFrequency] = useState({});
  const [selectedFq, setSelectedFQ] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState(0);
  const [zoom, setZoom] = useState(1);
  const imagePreviewRef = useRef();
  const [mouseOverImgPos, clearMouseOverImgPos] = useMouthPosition(
    imagePreviewRef,
    image
  );
  const [requestStatus, setRequestStatus] = useState(null);

  const pxPerPercentOfMHz =
    imagePreviewRef &&
    imagePreviewRef.current &&
    frequencyData.bandwidth / imagePreviewRef.current.clientWidth;
  const startingPosition =
    frequencyData.frequency - frequencyData.bandwidth / 2;
  const currentFQ =
    Math.round(
      ((startingPosition + mouseOverImgPos.x * pxPerPercentOfMHz) / MHz) * 100
    ) / 100;

  const handleImageUpload = (e) => {
    setFrequency(getFQDataFromFileName(e.target.files[0].name));
    setImage(URL.createObjectURL(e.target.files[0]));
  };

  const handleFQSelection = () => {
    setSelectedFQ(currentFQ);
    setSelectedPosition(mouseOverImgPos.x);
    if (requestStatus) setRequestStatus(null);
  };

  const clearSelectedFQ = () => {
    setSelectedFQ(0);
    setSelectedPosition(0);
  };
  const scrollContainer = useRef();

  const handleZoom = (zoom) => (e) => {
    setZoom(zoom);
    clearSelectedFQ();
    // clearMouseOverImgPos();
    if (scrollContainer.current) {
      scrollContainer.current.container.current.scrollTop = 0;
      scrollContainer.current.container.current.scrollLeft = 0;
    }
  };

  const handleImageSelect = (image) => () => {
    setFrequency(getFQDataFromFileName(image));
    setImage(image);
    clearSelectedFQ();
    handleZoom(1)();
  };
  const handleScroll = (ev, x) => {};

  const handleSaveFq = async () => {
    let res;
    try {
      res = await fetch(`/api/addToCsv/${selectedFq * MHz}`).then((r) =>
        r.json()
      );
    } catch (err) {
      res = {
        success: false,
      };
    }
    setRequestStatus(res);
  };

  return (
    <section className="app selector-container">
      <div className="app__header">
        <div className="d-flex justify-content-between">
          {/*<div>*/}
          {/*    <h6>Завантажте файл</h6>*/}
          {/*    <input type="file" onChange={handleImageUpload}/>*/}
          {/*</div>*/}
          <div className="d-flex flex-column">
            <div className="images-list">
              {imgs.map((image) => {
                const { dateTime } = getFQDataFromFileName(image);
                return (
                  <a
                    href="#"
                    onClick={handleImageSelect(image)}
                    style={{ fontSize: "75%" }}
                    key={image}
                  >
                    {formatDistanceToNow(dateTime)},{" "}
                    {formatDate(dateTime, dateToken)}
                  </a>
                );
              })}
            </div>
          </div>
          <div className="d-flex">
            {!!selectedFq && (
              <div>
                <b>Вибрана частота: {selectedFq} MHz</b>{" "}
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSaveFq}
                  disabled={requestStatus && requestStatus.success}
                >
                  {requestStatus
                    ? requestStatus.success
                      ? "успішно"
                      : "неуспішно"
                    : "записати"}
                </button>
              </div>
            )}
          </div>
          <div className="d-flex flex-column justify-content-between align-items-end">
            {!!image && (
              <div className="">
                <div
                  className="btn-group"
                  role="group"
                  aria-label="Basic example"
                >
                  {ZOOM_OPTIONS.map((z) => (
                    <button
                      type="button"
                      onClick={handleZoom(z)}
                      key={z}
                      className={`btn btn-${
                        z === zoom ? "primary" : "secondary"
                      }`}
                    >
                      x{z}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="app__content">
        {!!image && (
          <ScrollContainer
            ref={scrollContainer}
            className="fq-container"
            onClick={handleFQSelection}
          >
            <img
              ref={imagePreviewRef}
              width="auto"
              src={"/api/image/" + image}
              alt={image}
              style={{
                height: `${zoom * 100}%`,
              }}
            />
            <>
              {selectedPosition ? (
                <div
                  className="fq-selector selected"
                  style={{
                    left: selectedPosition + "px",
                    height: mouseOverImgPos.height,
                  }}
                />
              ) : null}
              <div
                className="fq-selector"
                style={{
                  left: mouseOverImgPos.x + "px",
                  height: mouseOverImgPos.height,
                }}
              />
              <div
                className="fq-value"
                style={{
                  left: mouseOverImgPos.x + "px",
                  top: mouseOverImgPos.y + "px",
                }}
              >
                {currentFQ + "MHz"}
              </div>
            </>
          </ScrollContainer>
        )}
      </div>
    </section>
  );
}

export default FQSelector;
