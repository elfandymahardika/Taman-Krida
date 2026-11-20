import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../domain/entities/cultural_event.dart';
import '../../../widgets/common/artwork_image.dart';
import '../../../widgets/common/pill_badge.dart';

/// Carousel geser kartu acara mendatang + indikator titik.
class EventCarousel extends StatefulWidget {
  const EventCarousel({super.key, required this.events, required this.onOpen});

  final List<CulturalEvent> events;
  final ValueChanged<CulturalEvent> onOpen;

  @override
  State<EventCarousel> createState() => _EventCarouselState();
}

class _EventCarouselState extends State<EventCarousel> {
  final _controller = PageController(viewportFraction: 0.88);
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final events = widget.events;
    return Column(
      children: [
        SizedBox(
          height: 220,
          child: PageView.builder(
            controller: _controller,
            itemCount: events.length,
            onPageChanged: (page) => setState(() => _page = page),
            itemBuilder: (context, index) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: _EventSlide(
                event: events[index],
                onTap: () => widget.onOpen(events[index]),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            for (var i = 0; i < events.length; i++)
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOut,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: i == _page ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: i == _page ? AppColors.maroon : AppColors.border,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _EventSlide extends StatelessWidget {
  const _EventSlide({required this.event, required this.onTap});

  final CulturalEvent event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      shadowColor: AppColors.cardShadow,
      child: InkWell(
        onTap: onTap,
        child: Stack(
          fit: StackFit.expand,
          children: [
            ArtworkImage(event.imageAsset, cacheWidth: 900),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x00000000), Color(0xD9200A08)],
                  stops: [0.35, 1],
                ),
              ),
            ),
            Positioned(top: 12, left: 12, child: _DateChip(date: event.date)),
            Positioned(
              top: 12,
              right: 12,
              child: PillBadge(
                event.category,
                color: AppColors.maroonDark,
                background: AppColors.gold,
                fontSize: 10,
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 3,
                ),
              ),
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 14,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.playfair(
                      17,
                      color: AppColors.white,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.place_outlined,
                        size: 14,
                        color: AppColors.blush,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${event.venueShort} · ${event.startTime} WIB',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.poppins(11, color: AppColors.blush),
                        ),
                      ),
                      Text(
                        event.price > 0
                            ? Formatters.rupiah(event.price)
                            : 'Gratis',
                        style: AppText.poppins(
                          12,
                          weight: FontWeight.w700,
                          color: AppColors.gold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateChip extends StatelessWidget {
  const _DateChip({required this.date});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 46,
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            Formatters.twoDigits(date.day),
            style: AppText.poppins(
              16,
              weight: FontWeight.w700,
              color: AppColors.maroon,
              height: 1.1,
            ),
          ),
          Text(
            Formatters.monthShort(date.month).toUpperCase(),
            style: AppText.poppins(
              9,
              weight: FontWeight.w600,
              color: AppColors.maroon,
            ),
          ),
        ],
      ),
    );
  }
}
