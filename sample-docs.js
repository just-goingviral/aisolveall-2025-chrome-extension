async function updateGoogleDoc(documentId, content) {
    try {
      const response = await gapi.client.docs.documents.batchUpdate({
        documentId: documentId,
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content
            }
          }
        ]
      });
      console.log("Google Doc updated:", response);
      return response;
    } catch (error) {
      console.error("Error updating Google Doc:", error);
      throw error;
    }
  }
  
  // Example usage:
  // updateGoogleDoc("DOC_ID_HERE", "Hello from Aisolveall Assistant!");
