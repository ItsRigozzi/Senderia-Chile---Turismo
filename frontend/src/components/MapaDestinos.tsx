import React, { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface DestinoMapPoint {
  id: number;
  nombre: string;
  region_nombre: string;
  categoria_nombre?: string;
  latitud: number;
  longitud: number;
}

interface MapaDestinosProps {
  destinos: DestinoMapPoint[];
  onOpenDestination?: (id: number) => void;
  scrollWheelZoom?: boolean;
  footerText?: string;
}

const markerIcon = L.divIcon({
  className: 'senderia-map-marker',
  html: '<span class="senderia-map-marker-pin" aria-hidden="true"></span>',
  iconSize: [30, 40],
  iconAnchor: [15, 38],
  popupAnchor: [0, -34],
});

const FitDestinationMarkers: React.FC<{ destinos: DestinoMapPoint[] }> = ({ destinos }) => {
  const map = useMap();

  useEffect(() => {
    if (destinos.length === 0) return;
    const bounds = L.latLngBounds(destinos.map(({ latitud, longitud }) => [latitud, longitud]));
    if (destinos.length === 1) map.setView(bounds.getCenter(), 13);
    else map.fitBounds(bounds, { padding: [32, 32], maxZoom: 9 });
  }, [destinos, map]);

  return null;
};

const MapaDestinos: React.FC<MapaDestinosProps> = ({
  destinos,
  onOpenDestination,
  scrollWheelZoom = false,
  footerText = 'La ubicación usa las coordenadas registradas para cada destino.',
}) => {
  if (destinos.length === 0) return null;

  const firstDestination = destinos[0];
  const initialCenter: [number, number] = [firstDestination.latitud, firstDestination.longitud];
  const googleMapsUrl = (latitud: number, longitud: number) =>
    `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`;

  return (
    <div className="destination-map-card">
      <MapContainer
        center={initialCenter}
        zoom={destinos.length === 1 ? 13 : 4}
        minZoom={3}
        maxZoom={19}
        scrollWheelZoom={scrollWheelZoom}
        className="destination-map"
      >
        <FitDestinationMarkers destinos={destinos} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {destinos.map((destino) => (
          <Marker
            key={`${destino.id}-${destino.latitud}-${destino.longitud}`}
            position={[destino.latitud, destino.longitud]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{destino.nombre}</strong>
              <br />
              {destino.categoria_nombre ? `${destino.categoria_nombre} · ` : ''}{destino.region_nombre}, Chile
              <br />
              <a href={googleMapsUrl(destino.latitud, destino.longitud)} target="_blank" rel="noreferrer">
                Ver coordenadas en Google Maps
              </a>
              {onOpenDestination && (
                <>
                  <br />
                  <button className="destination-map-popup-button" onClick={() => onOpenDestination(destino.id)}>
                    Ver destino en Sendería
                  </button>
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="destination-map-footer">
        <span>{footerText}</span>
        {destinos.length === 1 && (
          <a href={googleMapsUrl(firstDestination.latitud, firstDestination.longitud)} target="_blank" rel="noreferrer">
            Ver en Google Maps
          </a>
        )}
      </div>
    </div>
  );
};

export default MapaDestinos;
