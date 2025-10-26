import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NiceModal, { useModal } from '@ebay/nice-modal-react';

export const ReleaseNotesDialog = NiceModal.create(() => {
  const modal = useModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (modal.visible) {
      // Navigate to release notes page
      navigate('/release-notes');
      // Immediately resolve the modal
      modal.resolve();
    }
  }, [modal.visible, navigate, modal]);

  // Don't render anything - just handle navigation
  return null;
});
