"use client";

import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";

export interface MonitoringStation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  currentAQI: number;
  primarySourceSector: string;
}

interface MonitoringMapProps {
  stationsData: MonitoringStation[];
  selectedStation: MonitoringStation;
  onSelectStation: (station: MonitoringStation) => void;
}

export default function MonitoringMap({
  stationsData,
  selectedStation,
  onSelectStation,
}: MonitoringMapProps) {
  return (
    <MapContainer
      center={[28.6139, 77.209]}
      zoom={11}
      scrollWheelZoom={false}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "550px",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {stationsData.map((station) => (
        <MarkerGroup
          key={station.id}
          station={station}
          selected={selectedStation.id === station.id}
          onClick={onSelectStation}
        />
      ))}
    </MapContainer>
  );
}

interface MarkerGroupProps {
  station: MonitoringStation;
  selected: boolean;
  onClick: (station: MonitoringStation) => void;
}

function MarkerGroup({ station, selected, onClick }: MarkerGroupProps) {
  return (
    <>
      <CircleMarker
        center={[station.lat, station.lng]}
        radius={selected ? 32 : 20}
        pathOptions={{
          color: selected ? "#2563EB" : "#DC2626",
          fillColor: selected ? "#3B82F6" : "#EF4444",
          fillOpacity: 0.25,
          weight: 2,
        }}
      />

      <Marker
        position={[station.lat, station.lng]}
        eventHandlers={{
          click: () => onClick(station),
        }}
      >
        <Popup>
          <div className="p-1 font-sans">
            <p className="font-bold text-slate-800">{station.name}</p>

            <p className="text-xs text-slate-600 mt-1">
              Current AQI: {station.currentAQI}
            </p>

            <p className="text-xs text-rose-600 font-medium mt-0.5">
              Primary Source Wind: {station.primarySourceSector} Quad
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
