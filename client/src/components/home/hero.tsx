import React from "react";
import { color1, color2, color3, color4, color5, color6 } from "../../global";
import useIsMobile from "../../hooks/useIsMobile";

function AppHero() {
  const isMobile = useIsMobile();
  return (
    <div id="hero" className="heroBlock">
      <div className="mainButtonContainer">
        <button className="myButton" style={{backgroundColor:`${color6}`, color:`${color1}`, width: isMobile ? "30%" : "15%", height: isMobile ? "30%" : "15%"}} >
        Bio
        </button>
        <button className="myButton" style={{backgroundColor:`${color3}`, color:`${color5}`, width: isMobile ? "30%" : "15%", height: isMobile ? "30%" : "15%"}}>
        Music
        </button>
        <button className="myButton" style={{backgroundColor:`${color2}`, color:`${color4}`, width: isMobile ? "30%" : "15%", height: isMobile ? "30%" : "15%"}}>
        Travel
        </button>
        </div>
    </div>
  );
}

export default AppHero;
