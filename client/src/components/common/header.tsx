import React from "react";
// import { Anchor } from "antd";
import { color4 } from "../../global";
import { Image } from "rebass";
import logonomadmee from "../../assets/images/logonomadmee.png";
import camelsCaravan from "../../assets/images/camelscaravan.png";
import useIsMobile from "../../hooks/useIsMobile";
import useFetcher from "../../api/fetcher";

// const { Link } = Anchor;

function AppHeader() {
  // const [visible, setVisible] = useState(false);

  const isMobile = useIsMobile();
  const {data, loading, error} = useFetcher("/testenv.php")

  console.log("data", data,"loading", loading,"error", error)

  // const onClose = () => {
  //   setVisible(false);
  // };

  return (
    <div className="container-fluid">
      {/* Main Header */}
      <div
        className="header"
      >
        {/* Extreme Left Logo */}
        <div style={{ flex: "0 0 auto" }}>
          <Image
            src={logonomadmee}
            sx={{
              maxWidth: "100%",
              width: isMobile ? "6rem" : "7rem",
            }}
            alt="NomadMee Logo"
          />
        </div>

        {/* Center Text */}
        <div
          style={{
            flex: "1 1 auto",
            textAlign: "center",
            color: color4,
            fontSize: isMobile ? "1rem" : "1.5rem",
            fontWeight: "bold",
            whiteSpace: "normal",
            overflow: "hidden",
          }}
        >
          Bridging Trade Across Continents
        </div>

        {/* Extreme Right Image */}
        <div style={{ flex: "0 0 auto" }}>
          <Image
            src={camelsCaravan}
            sx={{
              maxWidth: "100%",
              width: isMobile ? "10rem" : "11rem",
            }}
            alt="Camels Caravan"
          />
        </div>
      </div>

      {/* Sticky Navigation Bar */}
      <div className="stickyMenu">
        <ul className="menuItems">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="china">China</a>
          </li>
          <li>
            <a href="africa">Africa</a>
          </li>
          <li>
            <a href="europe">Europe</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AppHeader;
