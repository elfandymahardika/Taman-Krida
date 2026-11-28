import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/constants/tkbj_location.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../domain/entities/facility.dart';

/// Peta OpenStreetMap area Taman Krida Budaya Jatim dengan batas lahan
/// dan pin bernomor tiap fasilitas. Pin diketuk → detail fasilitas.
class InteractiveMap extends StatefulWidget {
  const InteractiveMap({
    super.key,
    required this.facilities,
    required this.onPinTap,
  });

  final List<Facility> facilities;
  final ValueChanged<Facility> onPinTap;

  static const _pinSize = 26.0;
  static const _initialZoom = 18.0;

  @override
  State<InteractiveMap> createState() => _InteractiveMapState();
}

class _InteractiveMapState extends State<InteractiveMap> {
  final _controller = MapController();

  static LatLng _latLng((double, double) p) => LatLng(p.$1, p.$2);

  static final _center = _latLng(TkbjLocation.center);
  static final _boundary = [for (final p in TkbjLocation.boundary) _latLng(p)];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _recenter() => _controller.move(_center, InteractiveMap._initialZoom);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 240,
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      clipBehavior: Clip.antiAlias,
      child: FlutterMap(
        mapController: _controller,
        options: MapOptions(
          initialCenter: _center,
          initialZoom: InteractiveMap._initialZoom,
          minZoom: 15,
          maxZoom: 19,
          backgroundColor: AppColors.cream,
          interactionOptions: const InteractionOptions(
            flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
          ),
        ),
        children: [
          TileLayer(
            urlTemplate: TkbjLocation.tileUrl,
            userAgentPackageName: TkbjLocation.userAgentPackage,
            maxNativeZoom: 19,
          ),
          PolygonLayer(
            polygons: [
              Polygon(
                points: _boundary,
                color: AppColors.maroon.withValues(alpha: 0.10),
                borderColor: AppColors.maroon,
                borderStrokeWidth: 2,
              ),
            ],
          ),
          MarkerLayer(
            markers: [
              for (final facility in widget.facilities)
                if (facility.mapPosition case final position?)
                  Marker(
                    point: LatLng(position.latitude, position.longitude),
                    width: InteractiveMap._pinSize,
                    height: InteractiveMap._pinSize,
                    child: _MapPin(
                      number: facility.number,
                      label: facility.name,
                      onTap: () => widget.onPinTap(facility),
                    ),
                  ),
            ],
          ),
          Align(
            alignment: Alignment.topRight,
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Material(
                color: AppColors.white,
                shape: const CircleBorder(),
                elevation: 2,
                child: IconButton(
                  tooltip: 'Kembali ke TKBJ',
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(
                    Icons.my_location,
                    size: 18,
                    color: AppColors.maroon,
                  ),
                  onPressed: _recenter,
                ),
              ),
            ),
          ),
          // Atribusi wajib lisensi ODbL OpenStreetMap.
          Align(
            alignment: Alignment.bottomRight,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              color: AppColors.white.withValues(alpha: 0.85),
              child: Text(
                '© OpenStreetMap contributors',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.poppins(9, color: AppColors.ink),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapPin extends StatelessWidget {
  const _MapPin({
    required this.number,
    required this.label,
    required this.onTap,
  });

  final int number;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.maroon,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.white, width: 1.5),
            boxShadow: const [
              BoxShadow(color: Color(0x40000000), blurRadius: 4),
            ],
          ),
          child: Text(
            '$number',
            style: AppText.poppins(
              11,
              weight: FontWeight.w700,
              color: AppColors.white,
              height: 1,
            ),
          ),
        ),
      ),
    );
  }
}
