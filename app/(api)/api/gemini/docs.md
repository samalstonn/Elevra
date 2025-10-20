# Attachments

> Send emails with attachments.

There are two ways to send attachments:

1. [From a remote file](#send-attachments-from-a-remote-file)
2. [From a local file](#send-attachments-from-a-local-file)

<Info>
  We currently do not support sending attachments [when using our batch
  endpoint](/api-reference/emails/send-batch-emails).
</Info>

## Send attachments from a remote file

Include the `path` parameter to send attachments from a remote file. This parameter accepts a URL to the file you want to attach.

Define the file name that will be attached using the `filename` parameter.

<CodeGroup>
  ```ts Node.js {12-13}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: ['delivered@resend.dev'],
    subject: 'Receipt for your payment',
    html: '<p>Thanks for the payment</p>',
    attachments: [
      {
        path: 'https://resend.com/static/sample/invoice.pdf',
        filename: 'invoice.pdf',
      },
    ],
  });
  ```

  ```php PHP {10-11}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->emails->send([
    'from' => 'Acme <onboarding@resend.dev>',
    'to' => ['delivered@resend.dev'],
    'subject' => 'Receipt for your payment',
    'html' => '<p>Thanks for the payment</p>',
    'attachments' => [
      [
        'path' => 'https://resend.com/static/sample/invoice.pdf',
        'filename' => 'invoice.pdf'
      ]
    ]
  ]);
  ```

  ```python Python {6-7}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  attachment: resend.RemoteAttachment = {
    "path": "https://resend.com/static/sample/invoice.pdf",
    "filename": "invoice.pdf",
  }

  params: resend.Emails.SendParams = {
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "Receipt for your payment",
    "html": "<p>Thanks for the payment</p>",
    "attachments": [attachment],
  }

  resend.Emails.send(params)
  ```

  ```rb Ruby {12-13}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  params = {
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "Receipt for your payment",
    "html": "<p>Thanks for the payment</p>",
    "attachments": [
      {
        "path": "https://resend.com/static/sample/invoice.pdf",
        "filename": 'invoice.pdf',
      }
    ]
  }

  Resend::Emails.send(params)
  ```

  ```go Go {12-13}
  import (
  	"fmt"

  	"github.com/resend/resend-go/v2"
  )

  func main() {
    ctx := context.TODO()
    client := resend.NewClient("re_xxxxxxxxx")

    attachment := &resend.Attachment{
      Path:  "https://resend.com/static/sample/invoice.pdf",
      Filename: "invoice.pdf",
    }

    params := &resend.SendEmailRequest{
        From:        "Acme <onboarding@resend.dev>",
        To:          []string{"delivered@resend.dev"},
        Subject:     "Receipt for your payment",
        Html:        "<p>Thanks for the payment</p>",
        Attachments: []*resend.Attachment{attachment},
    }

    sent, err := client.Emails.SendWithContext(ctx, params)

    if err != nil {
      panic(err)
    }
    fmt.Println(sent.Id)
  }
  ```

  ```rust Rust {12-13}
  use resend_rs::types::{Attachment, CreateEmailBaseOptions};
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let from = "Acme <onboarding@resend.dev>";
    let to = ["delivered@resend.dev"];
    let subject = "Receipt for your payment";

    let path = "https://resend.com/static/sample/invoice.pdf";
    let filename = "invoice.pdf";

    let email = CreateEmailBaseOptions::new(from, to, subject)
      .with_html("<p>Thanks for the payment</p>")
      .with_attachment(Attachment::from_path(path).with_filename(filename));

    let _email = resend.emails.send(email).await?;

    Ok(())
  }
  ```

  ```java Java {8-9}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          Attachment att = Attachment.builder()
                  .path("https://resend.com/static/sample/invoice.pdf")
                  .fileName("invoice.pdf")
                  .build();

          CreateEmailOptions params = CreateEmailOptions.builder()
                  .from("Acme <onboarding@resend.dev>")
                  .to("delivered@resend.dev")
                  .subject("Receipt for your payment")
                  .html("<p>Thanks for the payment</p>")
                  .attachments(att)
                  .build();

          CreateEmailResponse data = resend.emails().send(params);
      }
  }
  ```

  ```csharp .NET {14-18}
  using Resend;
  using System.Collections.Generic;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var message = new EmailMessage()
  {
      From = "Acme <onboarding@resend.dev>",
      To = "delivered@resend.dev",
      Subject = "Receipt for your payment",
      HtmlBody = "<p>Thanks for the payment</p>",
  };

  message.Attachments = new List<EmailAttachment>();
  message.Attachments.Add( new EmailAttachment() {
    Filename = "invoice.pdf",
    Path = "https://resend.com/static/sample/invoice.pdf",
  } );

  var resp = await resend.EmailSendAsync( message );
  Console.WriteLine( "Email Id={0}", resp.Content );
  ```

  ```bash cURL {11-12}
  curl -X POST 'https://api.resend.com/emails' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "Receipt for your payment",
    "html": "<p>Thanks for the payment</p>",
    "attachments": [
      {
        "path": "https://resend.com/static/sample/invoice.pdf",
        "filename": "invoice.pdf"
      }
    ]
  }'
  ```
</CodeGroup>

## Send attachments from a local file

Include the `content` parameter to send attachments from a local file. This parameter accepts the Base64 encoded content of the file you want to attach.

Define the file name that will be attached using the `filename` parameter.

<CodeGroup>
  ```ts Node.js {16-17}
  import { Resend } from 'resend';
  import fs from 'fs';

  const resend = new Resend('re_xxxxxxxxx');

  const filepath = `${__dirname}/static/invoice.pdf`;
  const attachment = fs.readFileSync(filepath).toString('base64');

  await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: ['delivered@resend.dev'],
    subject: 'Receipt for your payment',
    text: '<p>Thanks for the payment</p>',
    attachments: [
      {
        content: attachment,
        filename: 'invoice.pdf',
      },
    ],
  });
  ```

  ```php PHP {10-11}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->emails->send([
    'from' => 'Acme <onboarding@resend.dev>',
    'to' => ['delivered@resend.dev'],
    'subject' => 'Receipt for your payment',
    'html' => '<p>Thanks for the payment</p>',
    'attachments' => [
      [
        'filename' => 'invoice.pdf',
        'content' => $invoiceBuffer
      ]
    ]
  ]);
  ```

  ```python Python {10}
  import os
  import resend

  resend.api_key = "re_xxxxxxxxx"

  f: bytes = open(
    os.path.join(os.path.dirname(__file__), "../static/invoice.pdf"), "rb"
  ).read()

  attachment: resend.Attachment = {"content": list(f), "filename": "invoice.pdf"}

  params: resend.Emails.SendParams = {
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "Receipt for your payment",
    "html": "<p>Thanks for the payment</p>",
    "attachments": [attachment],
  }

  resend.Emails.send(params)
  ```

  ```rb Ruby {14-15}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  file = IO.read("invoice.pdf")

  params = {
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "Receipt for your payment",
    "html": "<p>Thanks for the payment</p>",
    "attachments": [
      {
        "content": file.bytes,
        "filename": 'invoice.pdf',
      }
    ]
  }

  Resend::Emails.send(params)
  ```

  ```go Go {19-20}
  import (
  	"fmt"
  	"os"

  	"github.com/resend/resend-go/v2"
  )

  func main() {
    ctx := context.TODO()
    client := resend.NewClient("re_xxxxxxxxx")

    pwd, _ := os.Getwd()
    f, err := os.ReadFile(pwd + "/static/invoice.pdf")
    if err != nil {
      panic(err)
    }

    attachment := &resend.Attachment{
      Content:  f,
      Filename: "invoice.pdf",
    }

    params := &resend.SendEmailRequest{
        From:        "Acme <onboarding@resend.dev>",
        To:          []string{"delivered@resend.dev"},
        Subject:     "Receipt for your payment",
        Html:        "<p>Thanks for the payment</p>",
        Attachments: []*resend.Attachment{attachment},
    }

    sent, err := client.Emails.SendWithContext(ctx, params)

    if err != nil {
      panic(err)
    }
    fmt.Println(sent.Id)
  }
  ```

  ```rust Rust {22}
  use std::fs::File;
  use std::io::Read;

  use resend_rs::types::{Attachment, CreateEmailBaseOptions};
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let from = "Acme <onboarding@resend.dev>";
    let to = ["delivered@resend.dev"];
    let subject = "Receipt for your payment";

    let filename = "invoice.pdf";
    let mut f = File::open(filename).unwrap();
    let mut invoice = Vec::new();
    f.read_to_end(&mut invoice).unwrap();

    let email = CreateEmailBaseOptions::new(from, to, subject)
      .with_html("<p>Thanks for the payment</p>")
      .with_attachment(Attachment::from_content(invoice).with_filename(filename));

    let _email = resend.emails.send(email).await?;

    Ok(())
  }
  ```

  ```java Java {8-9}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          Attachment att = Attachment.builder()
                  .fileName("invoice.pdf")
                  .content("invoiceBuffer")
                  .build();

          CreateEmailOptions params = CreateEmailOptions.builder()
                  .from("Acme <onboarding@resend.dev>")
                  .to("delivered@resend.dev")
                  .subject("Receipt for your payment")
                  .html("<p>Thanks for the payment</p>")
                  .attachments(att)
                  .build();

          CreateEmailOptions params = CreateEmailOptions.builder()
      }
  }
  ```

  ```csharp .NET {15-19}
  using Resend;
  using System.Collections.Generic;
  using System.IO;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var message = new EmailMessage()
  {
      From = "Acme <onboarding@resend.dev>",
      To = "delivered@resend.dev",
      Subject = "Receipt for your payment",
      HtmlBody = "<p>Thanks for the payment</p>",
  };

  message.Attachments = new List<EmailAttachment>();
  message.Attachments.Add( new EmailAttachment() {
    Filename = "invoice.pdf",
    Content = await File.ReadAllBytesAsync( "invoice.pdf" ),
  } );

  var resp = await resend.EmailSendAsync( message );
  Console.WriteLine( "Email Id={0}", resp.Content );
  ```

  ```bash cURL {11-12}
  curl -X POST 'https://api.resend.com/emails' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "Receipt for your payment",
    "html": "<p>Thanks for the payment</p>",
    "attachments": [
      {
        "content": "UmVzZW5kIGF0dGFjaG1lbnQgZXhhbXBsZS4gTmljZSBqb2Igc2VuZGluZyB0aGUgZW1haWwh%",
        "filename": "invoice.txt"
      }
    ]
  }'
  ```
</CodeGroup>

## Embed Images using CID

You can optionally embed an image in the HTML body of the email. Both remote and local attachments are supported. All attachment requirements, options, and limitations apply to embedded inline images as well.

Embedding images requires two steps:

**1. Add the CID in the email HTML.**

Use the prefix `cid:` to reference the ID in the `src` attribute of an image tag in the HTML body of the email.

```html
<img src="cid:logo-image" />
```

**2. Reference the CID in the attachment**

Include the `content_id` parameter in the attachment object (e.g. `content_id: "logo-image"`).

The ID is an arbitrary string set by you, and must be less than 128 characters.

Learn more about [embedding images](/dashboard/emails/embed-inline-images).

## Attachment Limitations

* Emails can be no larger than 40MB (including attachments after Base64 encoding).
* Not all file types are supported. See the list of [unsupported file types](/knowledge-base/what-attachment-types-are-not-supported).
* Emails with attachments cannot be scheduled.
* Emails with attachments cannot be sent using our [batching endpoint](/api-reference/emails/send-batch-emails).

<Note>
  All attachments (including inline images) do not currently display in the
  [emails dashboard](https://resend.com/emails) when previewing an email's HTML.
</Note>

## Examples

<CardGroup>
  <Card title="Attachments with Next.js (remote file)" icon="arrow-up-right-from-square" href="https://github.com/resend/resend-examples/tree/main/with-attachments">
    See the full source code.
  </Card>

  <Card title="Attachments with Next.js (local file)" icon="arrow-up-right-from-square" href="https://github.com/resend/resend-examples/tree/main/with-attachments-content">
    See the full source code.
  </Card>
</CardGroup>
