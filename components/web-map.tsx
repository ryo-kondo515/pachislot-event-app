import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Store } from '@/types';

interface WebMapProps {
  stores: Store[];
  onMarkerClick?: (store: Store) => void;
}

export function WebMap({ stores, onMarkerClick }: WebMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Leaflet.jsのスクリプトとCSSを動的に読み込む
    const loadLeaflet = async () => {
      // CSSを読み込む
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // JavaScriptを読み込む
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => initializeMap();
        document.body.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = (window as any).L;
      
      // 地図を初期化（関東を表示）
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true
      }).setView([35.6812, 139.7671], 8);

      // ズームコントロールを左下に追加
      L.control.zoom({
        position: 'bottomleft'
      }).addTo(map);

      // CartoDB Positronタイルレイヤーを追加
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      mapRef.current = map;
      
      // 店舗マーカーを追加
      updateMarkers();
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      updateMarkers();
    }
  }, [stores]);

  const updateMarkers = () => {
    if (!mapRef.current) return;

    const L = (window as any).L;

    // 既存のマーカーをクリア
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // 新しいマーカーを追加
    stores.forEach(store => {
      const colors: Record<number, string> = {
        5: '#FF1744',
        4: '#FF6F00',
        3: '#FFD700',
        2: '#4CAF50',
        1: '#2196F3'
      };
      const sizes: Record<number, number> = {
        5: 48,
        4: 40,
        3: 32,
        2: 28,
        1: 24
      };

      const color = colors[store.hotLevel] || '#2196F3';
      const size = sizes[store.hotLevel] || 24;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="position:relative; width:${size}px; height:${size}px; background:${color}; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <span style="color:white; font-size:${size * 0.5}px;">🔥</span>
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const marker = L.marker([store.latitude, store.longitude], { icon }).addTo(mapRef.current);

      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(store);
        }
      });

      markersRef.current.push(marker);
    });
  };

  return (
    <View style={styles.container}>
      <div ref={mapContainerRef as any} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
