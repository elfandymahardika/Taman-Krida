import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/open_external.dart';

/// Argumen layar pemutar video.
class VideoArgs {
  const VideoArgs({required this.url, required this.title});

  final String url;
  final String title;
}

/// Pemutar video dokumenter materi Edukasi (berkas unggahan admin atau
/// tautan langsung .mp4/.webm), layar gelap penuh dengan kontrol sederhana.
class VideoPlayerScreen extends StatefulWidget {
  const VideoPlayerScreen({super.key, required this.args});

  final VideoArgs args;

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  late final VideoPlayerController _controller =
      VideoPlayerController.networkUrl(Uri.parse(widget.args.url));
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onChange);
    _controller
        .initialize()
        .then((_) {
          if (mounted) _controller.play();
        })
        .catchError((Object _) {
          if (mounted) setState(() => _failed = true);
        });
  }

  void _onChange() {
    if (!mounted) return;
    if (_controller.value.hasError) _failed = true;
    setState(() {});
  }

  @override
  void dispose() {
    _controller.removeListener(_onChange);
    _controller.dispose();
    super.dispose();
  }

  void _togglePlay() {
    final value = _controller.value;
    if (value.isCompleted) _controller.seekTo(Duration.zero);
    value.isPlaying ? _controller.pause() : _controller.play();
  }

  static String _time(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return d.inHours > 0 ? '${d.inHours}:$m:$s' : '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final value = _controller.value;
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: AppColors.white,
        title: Text(
          widget.args.title,
          style: AppText.poppins(15, color: AppColors.white),
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: SafeArea(
        child: _failed
            ? _error()
            : !value.isInitialized
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.gold),
              )
            : Column(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: _togglePlay,
                      child: Center(
                        child: AspectRatio(
                          aspectRatio: value.aspectRatio,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              VideoPlayer(_controller),
                              if (!value.isPlaying)
                                const Icon(
                                  Icons.play_circle_fill,
                                  size: 72,
                                  color: Colors.white70,
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  VideoProgressIndicator(
                    _controller,
                    allowScrubbing: true,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    colors: const VideoProgressColors(
                      playedColor: AppColors.gold,
                      bufferedColor: Colors.white38,
                      backgroundColor: Colors.white12,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 4, 16, 12),
                    child: Row(
                      children: [
                        IconButton(
                          tooltip: value.isPlaying ? 'Jeda' : 'Putar',
                          color: AppColors.white,
                          onPressed: _togglePlay,
                          icon: Icon(
                            value.isPlaying ? Icons.pause : Icons.play_arrow,
                          ),
                        ),
                        Text(
                          '${_time(value.position)} / ${_time(value.duration)}',
                          style: AppText.poppins(12, color: AppColors.white),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _error() => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Video tidak dapat diputar',
            style: AppText.playfair(18, color: AppColors.white),
          ),
          const SizedBox(height: 8),
          Text(
            'Periksa koneksi internet, atau buka video di browser.',
            textAlign: TextAlign.center,
            style: AppText.poppins(12, color: Colors.white70),
          ),
          const SizedBox(height: 16),
          AppButton(
            label: 'Buka di Browser',
            onPressed: () => openExternal(context, widget.args.url),
          ),
        ],
      ),
    ),
  );
}
