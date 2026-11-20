import '../../core/error/failure.dart';
import '../datasources/remote/api_client.dart';

/// Menjalankan panggilan data source dan menerjemahkan [ApiException]
/// (detail HTTP) menjadi [Failure] (bahasa domain).
Future<T> guard<T>(Future<T> Function() call) async {
  try {
    return await call();
  } on ApiException catch (e) {
    throw e.toFailure();
  }
}

extension ApiExceptionToFailure on ApiException {
  Failure toFailure() => Failure(
    switch (status) {
      0 => FailureType.network,
      401 => FailureType.unauthorized,
      400 || 422 => FailureType.validation,
      404 => FailureType.notFound,
      409 => FailureType.conflict,
      _ => FailureType.server,
    },
    message,
    fields,
  );
}
